export const decodeUnicode = (str: string) => {
  return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
};

export const codeHTMLEntities = (str: string) => {
  return str.replace(/[\u00A0-\u9999<>\&]/g, (i) => '&#' + i.charCodeAt(0) + ';');
};

export const getContrastColor = (hex: string) => {
  if (!hex) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export const swapItem = <T>(arr: T[], index1: number, index2: number): T[] => {
  const result = [...arr];
  const temp = result[index1];
  result[index1] = result[index2];
  result[index2] = temp;
  return result;
};

export const getChainLogo = (chain: string) => {
  const c = chain.toLowerCase();
  if (c === 'ethereum' || c === 'eth') return '/images/ethereum_logo.png';
  if (c === 'bnb' || c === 'bsc') return '/images/bnb_logo.png';
  if (c === 'base') return '/images/base_logo.png';
  if (c === 'arbitrum' || c === 'arb') return '/images/arbitrum.png';
  return '/images/ethereum_logo.png'; // Default
};
