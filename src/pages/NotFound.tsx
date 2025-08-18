import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="absolute top-4 right-4 z-10">
        <HamburgerMenu />
      </div>
      <div className="text-center">
        <h1 className="text-4xl display-title mb-4">404</h1>
        <p className="text-xl body-text text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
