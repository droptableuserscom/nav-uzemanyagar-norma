export class ScraperError extends Error {
  type: "partial" | "breaking";
  constructor(message: string, type: ScraperError["type"]) {
    super(message);
    this.type = type;
  }
}
