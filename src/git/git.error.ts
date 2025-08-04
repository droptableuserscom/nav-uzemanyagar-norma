export class GitError extends Error {
  type: "push" | "pull" | "general";
  originalError?: Error;

  constructor(
    message: string,
    type: GitError["type"] = "general",
    originalError?: Error
  ) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.name = "GitError";
  }
}
