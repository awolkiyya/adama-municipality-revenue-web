export const buildFileUrl = (filePath?: string) => {
    if (!filePath) return "";
  
    if (filePath.startsWith("http")) return filePath;
  
    const base = process.env.NEXT_PUBLIC_BASE_URL;
  
    return `${base}${filePath}`;
  };