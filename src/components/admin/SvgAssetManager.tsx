import { useState } from 'react';
import { useSvgAssets } from '@/hooks/useSvgAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Trash2, RefreshCw } from 'lucide-react';

export const SvgAssetManager = () => {
  const { svgAssets, loading, getSvgUrl, uploadSvg, deleteSvg, refetch } = useSvgAssets();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      setFormData(prev => ({ ...prev, file }));
    } else {
      toast.error('Please select a valid SVG file');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.name) {
      toast.error('Please provide a file and name');
      return;
    }

    setUploading(true);
    try {
      const filePath = `${formData.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
      await uploadSvg(formData.file, filePath, formData.name, formData.description);
      toast.success('SVG uploaded successfully');
      setFormData({ name: '', description: '', file: null });
      // Reset file input
      const fileInput = document.getElementById('svg-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name: string, filePath: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await deleteSvg(name, filePath);
      toast.success('SVG deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading SVG assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New SVG Asset</CardTitle>
          <CardDescription>
            Upload SVG files to be used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., onboarding-icon-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the SVG asset"
              />
            </div>
            
            <div>
              <Label htmlFor="svg-file">SVG File</Label>
              <Input
                id="svg-file"
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
                required
              />
            </div>
            
            <Button type="submit" disabled={uploading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload SVG'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing SVG Assets</CardTitle>
          <CardDescription>
            Manage your uploaded SVG assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {svgAssets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No SVG assets found. Upload your first asset above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {svgAssets.map((asset) => (
                <Card key={asset.id} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{asset.name}</CardTitle>
                    {asset.description && (
                      <CardDescription className="text-xs">
                        {asset.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-center h-24 bg-muted rounded">
                      <img
                        src={getSvgUrl(asset.file_path)}
                        alt={asset.name}
                        className="max-h-20 max-w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {asset.file_path}
                      </code>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(asset.name, asset.file_path)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};