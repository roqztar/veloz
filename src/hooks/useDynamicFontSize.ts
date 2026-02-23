import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseDynamicFontSizeOptions {
  words: string[];
  containerWidth: number;
}

export function useDynamicFontSize({ words, containerWidth }: UseDynamicFontSizeOptions) {
  const [fontSize, setFontSize] = useState(64); // Default font size in pixels
  const [maxWordLength, setMaxWordLength] = useState(0);

  // Find the longest word in the text
  useEffect(() => {
    if (words.length === 0) return;
    
    const longest = words.reduce((max, word) => {
      // Clean word of any special characters for length calculation
      const cleanWord = word.replace(/[^\w\säöüÄÖÜß]/g, '');
      return cleanWord.length > max.length ? cleanWord : max;
    }, '');
    
    setMaxWordLength(longest.length);
  }, [words]);

  // Calculate optimal font size
  const calculateFontSize = useCallback(() => {
    if (containerWidth === 0 || maxWordLength === 0) return 64;

    // Available width (accounting for padding and side containers)
    const availableWidth = containerWidth * 0.85; // 85% of container width
    
    // Base calculation: assume average char width is ~0.6em at font-size
    // We need to fit: (left padding) + (word) + (right padding)
    // The ORP centering uses 350px on each side at base font size
    const sidePadding = 100; // px for the ORP side containers at max
    const effectiveWidth = availableWidth - (sidePadding * 2);
    
    // Calculate font size based on longest word
    // Average char width is roughly 0.5-0.7 of font size depending on font
    const charWidthRatio = 0.58; // Average for sans-serif fonts
    const estimatedCharWidth = charWidthRatio;
    
    // Target: longest word should fit in effectiveWidth
    const targetFontSize = effectiveWidth / (maxWordLength * estimatedCharWidth);
    
    // Clamp between min and max
    const minSize = 32;  // Minimum readable size
    const maxSize = 120; // Maximum size
    
    return Math.max(minSize, Math.min(maxSize, Math.floor(targetFontSize)));
  }, [containerWidth, maxWordLength]);

  // Update font size when dependencies change
  useEffect(() => {
    const newSize = calculateFontSize();
    setFontSize(newSize);
  }, [calculateFontSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateFontSize();
      setFontSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFontSize]);

  // Generate responsive font size classes
  const fontSizeClass = useMemo(() => {
    // Convert pixel size to tailwind-like class
    // We'll use inline style for precise control
    return fontSize;
  }, [fontSize]);

  return {
    fontSize,
    fontSizeClass,
    maxWordLength,
    fontSizeStyle: { fontSize: `${fontSize}px` }
  };
}
