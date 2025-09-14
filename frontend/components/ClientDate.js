import { useState, useEffect } from "react";

// Client-side only date formatter to prevent hydration mismatches
const ClientDate = ({ date, format = "full" }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to match what the server renders
    return <span>--</span>;
  }

  const dateObj = date ? new Date(date) : new Date();

  switch (format) {
    case "time":
      return <span>{dateObj.toLocaleTimeString()}</span>;
    case "date":
      return <span>{dateObj.toLocaleDateString()}</span>;
    case "full":
    default:
      return <span>{dateObj.toLocaleString()}</span>;
  }
};

export default ClientDate;
