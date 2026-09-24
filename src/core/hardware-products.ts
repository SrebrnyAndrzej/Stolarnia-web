export interface ProduktOkucia {
  id: string;
  producent: string;
  system: string;
  sku: string;
  rodzajSKU: "wariant" | "rodzina" | "bazowy";
  nazwa: string;
  rodzaj: "zestaw" | "element";
  zdjecieURL: string;
  zdjecieZrodloURL: string;
  zdjecieOpis?: string;
  zdjecia: string[];
  parametry: Record<string, string>;
  dokumenty: { nazwa: string; url: string }[];
  zrodloURL: string;
  pobrano: string;
  sha256: string;
  zatwierdzoneProdukcyjnie: false;
}
