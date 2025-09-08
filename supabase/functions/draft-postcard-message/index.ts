import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// =============================================================================
// API KEY MANAGER
// =============================================================================

interface ApiKeyConfig {
  key: string;
  lastUsed: number;
  requestCount: number;
  rateLimitResetTime: number;
  isBlocked: boolean;
}

class ApiKeyManager {
  private apiKey: string | null = null;
  private shorteningApiKey: string | null = null;

  public async initialize(): Promise<void> {
    console.log('🔄 Initializing API Key Manager...');
    if (!this.apiKey) {
      await this.loadApiKey();
    }
  }

  private async loadApiKey() {
    console.log('🔐 Loading API keys...');
    // Load environment variables
    const env = await load();
    
    // Main API key for general requests
    const key = env['ANTHROPIC_API_KEY_1'] || Deno.env.get('ANTHROPIC_API_KEY_1');
    
    if (!key || !key.trim()) {
      console.error('❌ ANTHROPIC_API_KEY_1 not found!');
      throw new Error('ANTHROPIC_API_KEY_1 not found. Please set this secret.');
    }
    
    this.apiKey = key.trim();
    console.log(`🔑 Using main API key ${this.apiKey.slice(-8)}`);

    // Separate API key for shortening operations
    const shorteningKey = env['ANTHROPIC_API_KEY_2'] || Deno.env.get('ANTHROPIC_API_KEY_2');
    
    if (shorteningKey && shorteningKey.trim()) {
      this.shorteningApiKey = shorteningKey.trim();
      console.log(`✂️ Using shortening API key ${this.shorteningApiKey.slice(-8)}`);
    } else {
      console.log(`⚠️ ANTHROPIC_API_KEY_2 not found, using main key for shortening`);
      this.shorteningApiKey = this.apiKey;
    }
  }

  public async getNextKeyWithDelay(): Promise<string> {
    await this.initialize();
    
    if (!this.apiKey) {
      throw new Error('No API key available');
    }
    
    return this.apiKey;
  }

  public async getShorteningKey(): Promise<string> {
    await this.initialize();
    
    if (!this.shorteningApiKey) {
      throw new Error('No shortening API key available');
    }
    
    return this.shorteningApiKey;
  }

  public async makeAnthropicRequestWithCycling(payload: any, useShortening: boolean = false): Promise<Response> {
    try {
      const apiKey = useShortening ? await this.getShorteningKey() : await this.getNextKeyWithDelay();
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        const responseText = await response.text();
        console.log(`🔴 Rate limit response: ${responseText}`);
        throw new Error(`Rate limited: ${responseText}`);
      }

      if (!response.ok) {
        const responseText = await response.text();
        console.log(`❌ API error ${response.status}: ${responseText}`);
        throw new Error(`API error ${response.status}: ${responseText}`);
      }

      return response;
      
    } catch (error) {
      throw error;
    }
  }
}

// =============================================================================
// CONGRESS BILL FINDER
// =============================================================================

interface BillResult {
  id: string;
  title: string;
  summary: string;
  number: string;
  status: string;
  url: string;
  funding?: string;
  keyFacts: string[];
}

class CongressBillFinder {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findRelevantBills(userConcern: string): Promise<BillResult[]> {
    const searchTerms = this.extractSearchTerms(userConcern);
    const bills: BillResult[] = [];
    
    for (const term of searchTerms) {
      try {
        const results = await this.searchBills(term);
        bills.push(...results);
      } catch (error) {
        console.log(`Congress API search failed for "${term}": ${error}`);
      }
    }
    
    return this.deduplicateAndRank(bills).slice(0, 25);
  }

  private extractSearchTerms(concern: string): string[] {
    if (/housing|rent|landlord|speculation/i.test(concern)) {
      return ['housing', 'rent', 'affordable housing', 'tenant'];
    }
    else if (/student.*loan|education.*debt|college.*debt/i.test(concern)) {
      return ['student loan', 'education', 'higher education', 'college'];
    }
    else if (/social.*security|retirement/i.test(concern)) {
      return ['social security', 'retirement', 'medicare', 'seniors'];
    }
    else if (/climate|environment|green|carbon/i.test(concern)) {
      return ['climate', 'environment', 'energy', 'infrastructure'];
    }
    else if (/health|prescription|drug|medical/i.test(concern)) {
      return ['healthcare', 'prescription', 'medicare', 'medicaid'];
    }
    else if (/tax|corporate|wall street/i.test(concern)) {
      return ['tax', 'corporate', 'revenue', 'finance'];
    }
    else if (/immigration|border/i.test(concern)) {
      return ['immigration', 'border', 'visa', 'citizenship'];
    }
    else if (/gun|firearm|violence/i.test(concern)) {
      return ['gun', 'firearm', 'violence', 'safety'];
    }
    
    const words = concern.toLowerCase().split(' ').filter(w => w.length > 3);
    const mainWord = words[0] || concern;
    
    return [mainWord, 'appropriations', 'budget'];
  }

  private async searchBills(searchTerm: string): Promise<BillResult[]> {
    const currentCongress = this.getCurrentCongressNumber();
    const url = `https://api.congress.gov/v3/bill?api_key=${this.apiKey}&format=json&limit=50&sort=introducedDate+desc&congress=${currentCongress}&billType=hr`;
    
    console.log(`   Searching Congress API for: "${searchTerm}"`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Congress API error: ${response.status}`);
    }
    
    const data = await response.json();
    const bills = data.bills || [];
    
    const relevantBills = bills.filter((bill: any) => {
      const title = (bill.title || '').toLowerCase();
      const policyArea = ((bill.policyArea || {}).name || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return title.includes(searchLower) || policyArea.includes(searchLower);
    });
    
    console.log(`   Found ${relevantBills.length} relevant bills for "${searchTerm}"`);
    
    const results: BillResult[] = [];
    
    for (const bill of relevantBills.slice(0, 3)) {
      try {
        const details = await this.getBillDetails(bill.url);
        results.push({
          id: bill.number?.replace(/[^0-9]/g, '') || 'unknown',
          title: bill.title || 'Untitled Bill',
          summary: details.summary || bill.title || '',
          number: bill.number || '',
          status: (bill.latestAction?.text || 'In Progress'),
          url: `https://www.congress.gov/bill/119th-congress/house-bill/${bill.number?.replace(/[^0-9]/g, '') || '0'}`,
          funding: details.funding,
          keyFacts: details.keyFacts
        });
      } catch (error) {
        console.log(`Failed to get details for bill ${bill.number}: ${error}`);
      }
    }
    
    return results;
  }

  private async getBillDetails(billApiUrl: string): Promise<{summary: string, funding?: string, keyFacts: string[]}> {
    try {
      const response = await fetch(`${billApiUrl}?api_key=${this.apiKey}&format=json`);
      if (!response.ok) return { summary: '', keyFacts: [] };
      
      const data = await response.json();
      const bill = data.bill || {};
      
      let summary = '';
      if (bill.summaries?.summaries?.[0]?.text) {
        summary = bill.summaries.summaries[0].text.slice(0, 400);
      }
      
      let funding;
      const fundingMatch = summary.match(/\$[\d,.]+ (?:billion|million|thousand)/i);
      if (fundingMatch) {
        funding = fundingMatch[0];
      }
      
      const keyFacts: string[] = [];
      if (bill.title) keyFacts.push(`Bill: ${bill.title}`);
      if (bill.latestAction?.text) keyFacts.push(`Status: ${bill.latestAction.text}`);
      if (funding) keyFacts.push(`Funding: ${funding}`);
      
      return { summary, funding, keyFacts };
    } catch (error) {
      return { summary: '', keyFacts: [] };
    }
  }

  private deduplicateAndRank(bills: BillResult[]): BillResult[] {
    const seen = new Set<string>();
    const unique = bills.filter(bill => {
      const key = bill.id + bill.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return unique.sort((a, b) => {
      const aScore = (a.funding ? 1 : 0) + (a.keyFacts.length * 0.1);
      const bScore = (b.funding ? 1 : 0) + (b.keyFacts.length * 0.1);
      return bScore - aScore;
    }).slice(0, 15);
  }

  private getCurrentCongressNumber(): number {
    const currentYear = new Date().getFullYear();
    return Math.floor((currentYear - 1789) / 2) + 1;
  }
}

// =============================================================================
// GUARDIAN API
// =============================================================================

interface GuardianArticle {
  title: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: {
    headline?: string;
    standfirst?: string;
    bodyText?: string;
  };
  tags?: Array<{
    id: string;
    type: string;
    webTitle: string;
  }>;
}

class GuardianApi {
  private apiKey: string;
  private baseUrl = 'https://content.guardianapis.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPoliticalNews(concern: string, zipCode?: string, maxResults = 12): Promise<{articles: GuardianArticle[]}> {
    const query = this.buildPoliticalQuery(concern);
    const fromDate = this.getLastTwoMonthsDate();
    const pageSize = Math.min(maxResults, 50);
    
    try {
      const url = `${this.baseUrl}/search?` + new URLSearchParams({
        'api-key': this.apiKey,
        'q': query,
        'section': 'us-news',
        'tag': 'us-news/us-politics|us-news/us-congress|us-news/trump-administration',
        'show-fields': 'headline,standfirst,bodyText',
        'order-by': 'newest',
        'page-size': String(pageSize),
        'from-date': fromDate
      });

      console.log(`   🇺🇸 Guardian US API query: "${query}"`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Guardian API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response?.status !== 'ok') {
        throw new Error(`Guardian API error: ${data.response?.message || 'Unknown error'}`);
      }

      const articles: GuardianArticle[] = (data.response?.results || [])
        .map((article: any) => ({
          title: article.webTitle || 'No title',
          webUrl: article.webUrl || '',
          webPublicationDate: article.webPublicationDate || '',
          fields: article.fields || {},
          tags: article.tags || []
        }))
        .slice(0, maxResults);

      console.log(`   Found ${articles.length} Guardian articles`);
      
      return { articles };
      
    } catch (error) {
      console.log(`   Guardian API search failed: ${error}`);
      return { articles: [] };
    }
  }

  private buildPoliticalQuery(concern: string): string {
    const concernLower = concern.toLowerCase();
    
    if (concernLower.includes('housing speculation')) {
      return `housing speculation rent prices corporate landlords USA America`;
    } else if (concernLower.includes('housing')) {
      return `housing rent prices affordability crisis United States America`;
    } else if (concernLower.includes('student loan')) {
      return `student loan debt forgiveness education costs USA federal`;
    } else if (concernLower.includes('climate')) {
      return `climate change environment disasters funding United States federal`;
    } else if (concernLower.includes('social security')) {
      return `Social Security benefits seniors retirement USA federal`;
    } else {
      return `${concern} policy legislation Congress United States federal government`;
    }
  }

  private getLastTwoMonthsDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split('T')[0];
  }
}

// =============================================================================
// NYT API
// =============================================================================

interface NYTArticle {
  headline: string;
  abstract: string;
  web_url: string;
  pub_date: string;
  source: string;
}

class NYTApi {
  private apiKey: string;
  private baseUrl = 'https://api.nytimes.com/svc/search/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPoliticalNews(concern: string, zipCode?: string, maxResults = 12): Promise<{articles: NYTArticle[]}> {
    const query = this.buildPoliticalQuery(concern);
    const beginDate = this.getLastTwoMonthsDate();
    const endDate = this.getTodayDate();
    
    try {
      const url = `${this.baseUrl}/articlesearch.json?` + new URLSearchParams({
        'api-key': this.apiKey,
        'q': query,
        'sort': 'newest',
        'fl': 'headline,abstract,web_url,pub_date,source',
        'page': '0',
        'begin_date': beginDate,
        'end_date': endDate
      });

      console.log(`   🗞️ NYT API query: "${query}"`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NYT API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`NYT API error: ${data.fault?.faultstring || 'Unknown error'}`);
      }

      const articles: NYTArticle[] = (data.response?.docs || [])
        .map((doc: any) => ({
          headline: doc.headline?.main || 'No headline',
          abstract: doc.abstract || 'No abstract available',
          web_url: doc.web_url || '',
          pub_date: doc.pub_date || '',
          source: 'The New York Times'
        }))
        .slice(0, maxResults);

      console.log(`   Found ${articles.length} NYT articles`);
      
      return { articles };
      
    } catch (error) {
      console.log(`   NYT API search failed: ${error}`);
      return { articles: [] };
    }
  }

  private buildPoliticalQuery(concern: string): string {
    const concernLower = concern.toLowerCase();
    
    if (concernLower.includes('housing speculation')) {
      return `housing speculation rent prices corporate landlords`;
    } else if (concernLower.includes('housing')) {
      return `housing rent prices affordability crisis`;
    } else if (concernLower.includes('student loan')) {
      return `student loan debt forgiveness education costs`;
    } else if (concernLower.includes('climate')) {
      return `climate change environment disasters funding`;
    } else if (concernLower.includes('social security')) {
      return `Social Security benefits seniors retirement`;
    } else {
      return `${concern} policy legislation Congress`;
    }
  }

  private getLastTwoMonthsDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }
}

// =============================================================================
// MAIN CLAUDE-FIRST GENERATOR
// =============================================================================

interface SourceAnalysis {
  coreTheme: string;
  policyArea: string;
  congressSearchQueries: string[];
  guardianSearchQuery: string;
  nytSearchQuery: string;
  tokensUsed: number;
}

interface RelevantSource {
  type: 'congress' | 'guardian' | 'nyt';
  title: string;
  url: string;
  description: string;
  relevanceScore: number;
  relevanceReason: string;
}

class ClaudeFirstGenerator {
  private congressFinder: CongressBillFinder;
  private guardianApi: GuardianApi;
  private nytApi: NYTApi;
  private apiManager: ApiKeyManager;

  constructor(
    congressApiKey: string, 
    guardianApiKey: string, 
    nytApiKey: string, 
    apiManager: ApiKeyManager
  ) {
    this.congressFinder = new CongressBillFinder(congressApiKey);
    this.guardianApi = new GuardianApi(guardianApiKey);
    this.nytApi = new NYTApi(nytApiKey);
    this.apiManager = apiManager;
  }

  async generatePostcard(request: {
    concern: string;
    personalImpact: string;
    zipCode: string;
    representative: { name: string; title: string };
  }): Promise<{
    postcard: string;
    sources: Array<{
      description: string;
      url: string;
      dataPointCount: number;
    }>;
  }> {
    console.log(`🧠 CLAUDE-FIRST ANALYSIS for: "${request.concern}"`);
    
    // Step 1: Claude analyzes user input and creates targeted search strategy
    const analysis = await this.analyzeUserConcern(request);
    console.log(`   🎯 Core theme: "${analysis.coreTheme}"`);
    
    // Step 2: Execute targeted searches based on Claude's analysis
    const [congressBills, guardianArticles, nytArticles] = await Promise.all([
      this.searchCongress(analysis.congressSearchQueries),
      this.searchGuardian(analysis.guardianSearchQuery, request.zipCode),
      this.searchNYT(analysis.nytSearchQuery, request.zipCode)
    ]);
    
    const totalSources = congressBills.length + guardianArticles.length + nytArticles.length;
    console.log(`   📰 Found ${totalSources} total sources`);
    
    // Step 3: Claude evaluates source relevance and writes informed postcard
    const postcardResult = await this.generateInformedPostcard(
      request, 
      analysis, 
      congressBills, 
      guardianArticles, 
      nytArticles
    );
    
    // Transform to app's expected format
    const appSources = postcardResult.relevantSources.map(source => ({
      description: source.description,
      url: source.url,
      dataPointCount: source.relevanceScore
    }));
    
    return {
      postcard: postcardResult.postcard,
      sources: appSources
    };
  }

  private async analyzeUserConcern(request: {
    concern: string;
    personalImpact: string;
    zipCode: string;
    representative: { name: string; title: string };
  }): Promise<SourceAnalysis> {
    const analysisPrompt = `USER INPUT:
Concern: "${request.concern}"
Personal Impact: "${request.personalImpact}"
Location: ZIP ${request.zipCode}
Representative: ${request.representative.title} ${request.representative.name}

ANALYSIS TASK:
Analyze this user input and extract the core policy theme, then design targeted search queries to find the most relevant sources.

REQUIRED OUTPUT FORMAT:
CORE_THEME: [Keep very close to user's original concern]
POLICY_AREA: [Specific policy category: housing, healthcare, education, climate, economy, etc.]

CONGRESS_SEARCH_QUERIES: 
- [Specific bill search term 1]
- [Specific bill search term 2]

GUARDIAN_SEARCH_QUERY: [Targeted search for Guardian API]
NYT_SEARCH_QUERY: [Targeted search for NYT API]

Keep core themes simple and close to original user input.`;

    try {
      const response = await this.apiManager.makeAnthropicRequestWithCycling({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        temperature: 0.1,
        messages: [{ role: 'user', content: analysisPrompt }]
      });

      const responseData = await response.json();
      
      let analysisText = '';
      for (const item of responseData.content || []) {
        if (item.type === 'text' && item.text) {
          analysisText = item.text;
          break;
        }
      }
      
      const usage = responseData.usage || {};
      const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
      
      // Parse Claude's analysis
      const coreThemeMatch = analysisText.match(/CORE_THEME:\s*(.+)/i);
      const policyAreaMatch = analysisText.match(/POLICY_AREA:\s*(\w+)/i);
      const congressMatch = analysisText.match(/CONGRESS_SEARCH_QUERIES:\s*\n((?:- .+\n?)+)/i);
      const guardianMatch = analysisText.match(/GUARDIAN_SEARCH_QUERY:\s*(.+)/i);
      const nytMatch = analysisText.match(/NYT_SEARCH_QUERY:\s*(.+)/i);
      
      let congressQueries = [request.concern]; // fallback
      if (congressMatch) {
        const rawQueries = congressMatch[1].split('\n')
          .map(line => line.replace(/^- /, '').trim())
          .filter(q => q && q.length > 0);
        if (rawQueries.length > 0) {
          congressQueries = rawQueries;
        }
      }
        
      return {
        coreTheme: coreThemeMatch?.[1]?.trim() || request.concern,
        policyArea: policyAreaMatch?.[1]?.trim() || 'general',
        congressSearchQueries: congressQueries,
        guardianSearchQuery: guardianMatch?.[1]?.trim() || request.concern,
        nytSearchQuery: nytMatch?.[1]?.trim() || request.concern,
        tokensUsed
      };
      
    } catch (error) {
      console.log(`   ❌ Analysis failed: ${error}`);
      return {
        coreTheme: request.concern,
        policyArea: 'general',
        congressSearchQueries: [request.concern],
        guardianSearchQuery: request.concern,
        nytSearchQuery: request.concern,
        tokensUsed: 0
      };
    }
  }

  private async searchCongress(queries: string[]): Promise<BillResult[]> {
    console.log(`🏛️ Searching Congress with queries: ${queries.join(', ')}`);
    let allBills: BillResult[] = [];
    
    for (const query of queries) {
      try {
        const bills = await this.congressFinder.findRelevantBills(query);
        allBills = allBills.concat(bills);
      } catch (error) {
        console.log(`   ❌ Congress search failed for "${query}": ${error}`);
      }
    }
    
    // Remove duplicates
    const uniqueBills = allBills.filter((bill, index, self) => 
      index === self.findIndex(b => b.number === bill.number)
    );
    
    console.log(`   🏛️ Found ${uniqueBills.length} unique bills`);
    return uniqueBills;
  }

  private async searchGuardian(query: string, zipCode: string): Promise<GuardianArticle[]> {
    console.log(`🇬🇧 Searching Guardian with: "${query}"`);
    try {
      const response = await this.guardianApi.searchPoliticalNews(query, zipCode, 15);
      console.log(`   🇬🇧 Found ${response.articles.length} Guardian articles`);
      return response.articles;
    } catch (error) {
      console.log(`   ❌ Guardian search failed: ${error}`);
      return [];
    }
  }

  private async searchNYT(query: string, zipCode: string): Promise<NYTArticle[]> {
    console.log(`🗞️ Searching NYT with: "${query}"`);
    try {
      const response = await this.nytApi.searchPoliticalNews(query, zipCode, 15);
      console.log(`   🗞️ Found ${response.articles.length} NYT articles`);
      return response.articles;
    } catch (error) {
      console.log(`   ❌ NYT search failed: ${error}`);
      return [];
    }
  }

  private async generateInformedPostcard(
    request: {
      concern: string;
      personalImpact: string;
      zipCode: string;
      representative: { name: string; title: string };
    },
    analysis: SourceAnalysis,
    congressBills: BillResult[],
    guardianArticles: GuardianArticle[],
    nytArticles: NYTArticle[]
  ): Promise<{postcard: string, relevantSources: RelevantSource[], tokensUsed: number}> {
    
    console.log(`✍️ Claude writing informed postcard...`);
    
    const postcardPrompt = `USER'S CORE CONCERN: ${analysis.coreTheme}
PERSONAL IMPACT: "${request.personalImpact}"
REPRESENTATIVE: ${request.representative.title} ${request.representative.name}
ZIP CODE: ${request.zipCode}

AVAILABLE SOURCES:

CONGRESS BILLS:
${congressBills.map((bill, i) => 
  `${i + 1}. H.R. ${bill.number} - ${bill.title}`
).join('\n') || 'No relevant bills found'}

GUARDIAN ARTICLES:
${guardianArticles.map((article, i) => 
  `${i + 1}. ${article.title}`
).join('\n') || 'No Guardian articles found'}

NEW YORK TIMES ARTICLES:
${nytArticles.map((article, i) => 
  `${i + 1}. ${article.headline}`
).join('\n') || 'No NYT articles found'}

WRITING TASK:
1. Write an informed postcard using relevant sources
2. Character limit: 270-290 characters (TARGET: 280 characters)
3. Include specific call to action

POSTCARD FORMAT:
${request.representative.title} ${request.representative.name?.split(' ').pop()},

[Persuasive message with personal impact and call to action]

REQUIRED OUTPUT FORMAT:
POSTCARD:
[The complete postcard text]

RELEVANT_SOURCES_USED:
${congressBills.length > 0 ? congressBills.map((_, i) => `CONGRESS_${i + 1}: [USED/NOT_USED] [reason]`).join('\n') : ''}
${guardianArticles.length > 0 ? guardianArticles.map((_, i) => `GUARDIAN_${i + 1}: [USED/NOT_USED] [reason]`).join('\n') : ''}
${nytArticles.length > 0 ? nytArticles.map((_, i) => `NYT_${i + 1}: [USED/NOT_USED] [reason]`).join('\n') : ''}

Make the message personal, urgent, and actionable within the character limit.`;

    try {
      const response = await this.apiManager.makeAnthropicRequestWithCycling({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        temperature: 0.1,
        messages: [{ role: 'user', content: postcardPrompt }]
      });

      const responseData = await response.json();
      
      let responseText = '';
      for (const item of responseData.content || []) {
        if (item.type === 'text' && item.text) {
          responseText = item.text;
          break;
        }
      }
      
      const usage = responseData.usage || {};
      const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
      
      // Parse the response
      const postcardMatch = responseText.match(/POSTCARD:\s*([\s\S]*?)(?=RELEVANT_SOURCES_USED:|$)/i);
      const postcard = postcardMatch?.[1]?.trim() || 'Failed to generate postcard';
      
      console.log(`   ✍️ Generated ${postcard.length} chars`);
      
      // Parse which sources were used
      const relevantSources = this.parseSourceUsage(responseText, congressBills, guardianArticles, nytArticles);
      
      // Handle character limits
      let finalPostcard = postcard;
      let finalTokens = tokensUsed;
      
      if (postcard.length > 295) {
        console.log(`   🚨 OVER 295 CHARS - Rewriting...`);
        const rewritten = await this.rewritePostcardUnder295(postcard, analysis.coreTheme, request.representative);
        finalPostcard = rewritten.postcard;
        finalTokens += rewritten.tokensUsed;
      } else if (postcard.length > 290) {
        console.log(`   ✂️ Shortening...`);
        const shortened = await this.shortenPostcard(postcard);
        finalPostcard = shortened.postcard;
        finalTokens += shortened.tokensUsed;
      } else if (postcard.length < 270) {
        console.log(`   📈 Expanding...`);
        const expanded = await this.expandPostcard(postcard, analysis.coreTheme);
        if (expanded.postcard.length <= 295) {
          finalPostcard = expanded.postcard;
          finalTokens += expanded.tokensUsed;
        }
      }
      
      return {
        postcard: finalPostcard,
        relevantSources,
        tokensUsed: finalTokens
      };
      
    } catch (error) {
      console.log(`   ❌ Postcard generation failed: ${error}`);
      console.log(`   ❌ Error details: ${JSON.stringify(error)}`);
      console.log(`   ❌ Error stack: ${error.stack}`);
      return {
        postcard: `Failed to generate postcard: ${error.message}`,
        relevantSources: [],
        tokensUsed: 0
      };
    }
  }

  private parseSourceUsage(
    responseText: string, 
    congressBills: BillResult[], 
    guardianArticles: GuardianArticle[], 
    nytArticles: NYTArticle[]
  ): RelevantSource[] {
    const allSources: RelevantSource[] = [];
    
    // Parse congress bill usage - only include noteworthy legislation
    congressBills.forEach((bill, i) => {
      const pattern = new RegExp(`CONGRESS_${i + 1}:\\s*(USED|NOT_USED)\\s*(.*)`, 'i');
      const match = responseText.match(pattern);
      if (match && match[1].toUpperCase() === 'USED') {
        // Filter for noteworthy bills by title characteristics
        const title = bill.title.toLowerCase();
        
        // Exclude technical amendments and minor changes
        const excludeKeywords = ['amendment', 'technical', 'clarification', 'correction', 'modification', 'redesignation', 'conforming'];
        const isExcluded = excludeKeywords.some(keyword => title.includes(keyword));
        
        // Include bills with impactful keywords
        const includeKeywords = ['act', 'reform', 'protection', 'investment', 'security', 'safety', 'healthcare', 'infrastructure', 'education', 'climate', 'energy'];
        const hasImpactfulKeywords = includeKeywords.some(keyword => title.includes(keyword));
        
        // Only include if not excluded and (has impactful keywords OR is reasonably short and broad)
        const isNoteworthyBill = !isExcluded && (hasImpactfulKeywords || bill.title.length < 100);
        
        if (isNoteworthyBill) {
          allSources.push({
            type: 'congress',
            title: `H.R. ${bill.number} - ${bill.title}`,
            url: bill.url,
            description: bill.title,
            relevanceScore: 10,
            relevanceReason: match[2] || 'Referenced in postcard'
          });
        }
      }
    });
    
    // Parse Guardian article usage
    let guardianSources: RelevantSource[] = [];
    guardianArticles.forEach((article, i) => {
      const pattern = new RegExp(`GUARDIAN_${i + 1}:\\s*(USED|NOT_USED)\\s*(.*)`, 'i');
      const match = responseText.match(pattern);
      if (match && match[1].toUpperCase() === 'USED') {
        guardianSources.push({
          type: 'guardian',
          title: article.title,
          url: article.webUrl,
          description: article.fields?.standfirst || article.title,
          relevanceScore: 8,
          relevanceReason: match[2] || 'Referenced in postcard'
        });
      }
    });
    
    // Parse NYT article usage
    let nytSources: RelevantSource[] = [];
    nytArticles.forEach((article, i) => {
      const pattern = new RegExp(`NYT_${i + 1}:\\s*(USED|NOT_USED)\\s*(.*)`, 'i');
      const match = responseText.match(pattern);
      if (match && match[1].toUpperCase() === 'USED') {
        nytSources.push({
          type: 'nyt',
          title: article.headline,
          url: article.web_url,
          description: article.abstract,
          relevanceScore: 8,
          relevanceReason: match[2] || 'Referenced in postcard'
        });
      }
    });
    
    // FALLBACK: If no sources were explicitly marked as USED, intelligently select the most relevant ones
    if (guardianSources.length === 0 && nytSources.length === 0) {
      console.log(`   🔍 No explicit source usage found, applying intelligent selection...`);
      
      // Rank Guardian articles by relevance
      guardianSources = this.rankNewsSources(guardianArticles.map(article => ({
        type: 'guardian' as const,
        title: article.title,
        url: article.webUrl,
        description: article.fields?.standfirst || article.title,
        relevanceScore: 0, // Will be calculated
        relevanceReason: 'Intelligent selection'
      })), responseText).slice(0, 2);
      
      // Rank NYT articles by relevance  
      nytSources = this.rankNewsSources(nytArticles.map(article => ({
        type: 'nyt' as const,
        title: article.headline,
        url: article.web_url,
        description: article.abstract,
        relevanceScore: 0, // Will be calculated
        relevanceReason: 'Intelligent selection'
      })), responseText).slice(0, 2);
    }
    
    // Apply news article limits: max 2 total, preferring one from each if both have relevant articles
    let selectedNewsSources: RelevantSource[] = [];
    
    if (guardianSources.length > 0 && nytSources.length > 0) {
      // Both have relevant articles - select one from each, prioritizing by relevance score
      const topGuardian = guardianSources.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
      const topNYT = nytSources.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
      selectedNewsSources.push(topGuardian, topNYT);
    } else if (guardianSources.length > 0) {
      // Only Guardian has relevant articles - take up to 2, sorted by relevance
      selectedNewsSources = guardianSources.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 2);
    } else if (nytSources.length > 0) {
      // Only NYT has relevant articles - take up to 2, sorted by relevance
      selectedNewsSources = nytSources.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 2);
    }
    
    // Combine congress bills with limited news sources
    const finalSources = [...allSources.filter(s => s.type === 'congress'), ...selectedNewsSources];
    
    // Convert to UI-expected format (description, url, dataPointCount)
    const uiSources = finalSources.map(source => ({
      description: source.description, // Use description instead of title for better context
      url: source.url,
      dataPointCount: source.relevanceScore
    }));
    
    console.log(`   📋 Identified ${finalSources.length} relevant sources (${allSources.filter(s => s.type === 'congress').length} bills, ${selectedNewsSources.length} news)`);
    return uiSources;
  }

  private rankNewsSources(sources: RelevantSource[], postcardText: string): RelevantSource[] {
    // Extract key terms from the postcard to help rank relevance
    const postcardLower = postcardText.toLowerCase();
    const keyTerms = this.extractKeyTerms(postcardLower);
    
    return sources.map(source => {
      let score = 0;
      const titleLower = source.title.toLowerCase();
      const descriptionLower = source.description.toLowerCase();
      
      // Score based on key term matches
      keyTerms.forEach(term => {
        if (titleLower.includes(term)) score += 3;
        if (descriptionLower.includes(term)) score += 2;
      });
      
      // Bonus for recent/timely articles (articles with "recent", "today", "this week", etc.)
      const timelinessTerms = ['recent', 'today', 'this week', 'latest', 'new', 'breaking', 'just', 'now'];
      timelinessTerms.forEach(term => {
        if (titleLower.includes(term) || descriptionLower.includes(term)) score += 1;
      });
      
      // Bonus for impact/action terms
      const impactTerms = ['families', 'communities', 'arrested', 'operations', 'enforcement', 'tactics', 'reform', 'policy'];
      impactTerms.forEach(term => {
        if (titleLower.includes(term) || descriptionLower.includes(term)) score += 1;
      });
      
      // Penalize overly broad/generic articles
      const genericTerms = ['news roundup', 'at a glance', 'updates', 'headlines'];
      genericTerms.forEach(term => {
        if (titleLower.includes(term)) score -= 2;
      });
      
      return {
        ...source,
        relevanceScore: Math.max(0, score) // Ensure non-negative score
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private extractKeyTerms(postcardText: string): string[] {
    // Extract meaningful terms from the postcard text
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    return postcardText
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Take top 10 meaningful terms
  }

  private async shortenPostcard(longPostcard: string): Promise<{postcard: string, tokensUsed: number}> {
    let currentPostcard = longPostcard;
    let totalTokens = 0;
    const maxRetries = 3;
    const targetLength = 290;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`   🔄 Shortening attempt ${attempt}/${maxRetries} (current: ${currentPostcard.length} chars)`);
      
      const shortenPrompt = `SHORTEN TO UNDER ${targetLength} CHARACTERS:

"${currentPostcard}"

Current length: ${currentPostcard.length} characters. Must be under ${targetLength} characters.
Keep core message, personal impact, and call to action. Return only the shortened postcard.`;

      try {
        const response = await this.apiManager.makeAnthropicRequestWithCycling({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          temperature: 0.1,
          messages: [{ role: 'user', content: shortenPrompt }]
        }, true); // Use shortening API key

        const responseData = await response.json();
        
        let shortened = currentPostcard;
        for (const item of responseData.content || []) {
          if (item.type === 'text' && item.text) {
            shortened = item.text.trim();
            break;
          }
        }
        
        const usage = responseData.usage || {};
        const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
        totalTokens += tokensUsed;
        
        console.log(`   📏 Attempt ${attempt} result: ${shortened.length} chars`);
        
        // If we're now under the target length, return success
        if (shortened.length <= targetLength) {
          console.log(`   ✅ Successfully shortened to ${shortened.length} chars in ${attempt} attempt(s)`);
          return { postcard: shortened, tokensUsed: totalTokens };
        }
        
        // Update current postcard for next attempt
        currentPostcard = shortened;
        
      } catch (error) {
        console.log(`   ❌ Shortening attempt ${attempt} failed: ${error}`);
        // For immediate API failures, return with ",,," 
        return { postcard: currentPostcard.substring(0, 287) + ',,,', tokensUsed: totalTokens };
      }
    }
    
    // If we exhausted all attempts, use "..."
    console.log(`   ⚠️ All ${maxRetries} shortening attempts exhausted, truncating to ${targetLength} chars`);
    return { postcard: currentPostcard.substring(0, 287) + '...', tokensUsed: totalTokens };
  }

  private async rewritePostcardUnder295(longPostcard: string, coreTheme: string, representative: any): Promise<{postcard: string, tokensUsed: number}> {
    const rewritePrompt = `REWRITE UNDER 295 CHARACTERS:

"${longPostcard}"

CORE THEME: ${coreTheme}
REPRESENTATIVE: ${representative.title} ${representative.name}

Must be under 295 characters. Keep core message and call to action. Return only the rewritten postcard.`;

    try {
      const response = await this.apiManager.makeAnthropicRequestWithCycling({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.1,
        messages: [{ role: 'user', content: rewritePrompt }]
      }, true); // Use shortening API key

      const responseData = await response.json();
      
      let rewritten = longPostcard;
      for (const item of responseData.content || []) {
        if (item.type === 'text' && item.text) {
          rewritten = item.text.trim();
          break;
        }
      }
      
      const usage = responseData.usage || {};
      const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
      
      if (rewritten.length > 295) {
        rewritten = rewritten.substring(0, 292) + '...';
      }
      
      return { postcard: rewritten, tokensUsed };
    } catch (error) {
      return { postcard: longPostcard.substring(0, 292) + ',,,', tokensUsed: 0 };
    }
  }

  private async expandPostcard(shortPostcard: string, coreTheme: string): Promise<{postcard: string, tokensUsed: number}> {
    const expandPrompt = `EXPAND TO 270-290 CHARACTERS:

"${shortPostcard}"

Core theme: ${coreTheme}

Add detail or urgency to reach 280 characters. Keep format and tone. Return only the expanded postcard.`;

    try {
      const response = await this.apiManager.makeAnthropicRequestWithCycling({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        temperature: 0.1,
        messages: [{ role: 'user', content: expandPrompt }]
      });

      const responseData = await response.json();
      
      let expanded = shortPostcard;
      for (const item of responseData.content || []) {
        if (item.type === 'text' && item.text) {
          expanded = item.text;
          break;
        }
      }
      
      const usage = responseData.usage || {};
      const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
      
      return { postcard: expanded, tokensUsed };
    } catch (error) {
      return { postcard: shortPostcard, tokensUsed: 0 };
    }
  }
}

// =============================================================================
// SERVER SETUP
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('Edge function called - draft-postcard-message (Claude-First System)');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestBody = await req.json();
    const { concerns, personalImpact, representative, zipCode } = requestBody;
    
    if (!concerns || !representative) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: concerns or representative'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get API keys from environment
    const congressApiKey = Deno.env.get('CONGRESS_API_KEY');
    const guardianApiKey = Deno.env.get('GUARDIAN_API_KEY');
    const nytApiKey = Deno.env.get('NYT_API_KEY');
    
    if (!congressApiKey || !guardianApiKey || !nytApiKey) {
      return new Response(JSON.stringify({
        error: 'Missing required API keys. Please configure CONGRESS_API_KEY, GUARDIAN_API_KEY, and NYT_API_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize API key manager and generator
    const apiManager = new ApiKeyManager();
    await apiManager.initialize();
    
    const generator = new ClaudeFirstGenerator(
      congressApiKey,
      guardianApiKey,
      nytApiKey,
      apiManager
    );
    
    // Transform app input to claude-first-system format
    const claudeRequest = {
      concern: concerns,
      personalImpact: personalImpact || `This issue matters deeply to me as a constituent in ZIP ${zipCode}`,
      zipCode: zipCode || 'Not provided',
      representative: {
        name: representative.name,
        title: representative.type?.toLowerCase() === 'representative' ? 'Rep.' : 'Sen.'
      }
    };
    
    // Generate postcard using complete claude-first-system
    const result = await generator.generatePostcard(claudeRequest);
    
    console.log(`Final message (${result.postcard.length} chars):`, result.postcard);
    
    // Return in app's expected format
    return new Response(JSON.stringify({ 
      draftMessage: result.postcard,
      sources: result.sources
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error in function:', error);
    console.error('Error details:', JSON.stringify(error));
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      draftMessage: `Generation failed: ${error.message}`,
      sources: []
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});