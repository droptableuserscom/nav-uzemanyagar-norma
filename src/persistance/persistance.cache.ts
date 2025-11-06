import { YearFuelPrices } from "../scraper/scraper.schema";
import GitService from "src/git/git.service";

class MemoryCache {
  private cache: Map<number, YearFuelPrices>;

  constructor() {
    this.cache = new Map();
  }

  async init() {
    try {
      const file = await GitService.getFile();
      this.cache = file.data;
    } catch (error) {
      console.error("Error initializing cache:", error);
    }
  }

  get(key: number) {
    return this.cache.get(key);
  }
  getAll() {
    return this.cache;
  }

  set(key: number, value: YearFuelPrices) {
    this.cache.set(key, value);
  }
}

class CacheContext {
  private static instance: MemoryCache;

  private constructor() {}

  public static async init() {
    CacheContext.instance = new MemoryCache();
    await CacheContext.instance.init();
  }

  public static getInstance(): MemoryCache {
    if (!CacheContext.instance) {
      console.log("Cache not initialized, initializing...");
      CacheContext.init();
    }
    return CacheContext.instance;
  }
}

export const cache = CacheContext.getInstance();
export const initCache = CacheContext.init;
