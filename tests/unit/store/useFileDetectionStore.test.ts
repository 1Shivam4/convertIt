import { describe, it, expect, beforeEach } from "vitest";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

// Helper to reset store state between tests
function resetStore() {
  useConverterStore.setState({
    stage: "idle",
    file: null,
    sourceType: null,
    targetFormat: null,
    outputFile: null,
    outputFileName: null,
    error: null,
  });
}

describe("useConverterStore — state machine", () => {
  beforeEach(resetStore);

  it("has correct initial state", () => {
    const state = useConverterStore.getState();
    expect(state.stage).toBe("idle");
    expect(state.file).toBeNull();
    expect(state.error).toBeNull();
    expect(state.outputFile).toBeNull();
  });

  it("setFile() transitions stage to 'detecting' and stores file", () => {
    const fakeFile = new File(["content"], "test.pdf", { type: "application/pdf" });
    useConverterStore.getState().setFile(fakeFile);
    const state = useConverterStore.getState();
    expect(state.stage).toBe("detecting");
    expect(state.file).toBe(fakeFile);
    expect(state.error).toBeNull();
    expect(state.outputFile).toBeNull();
  });

  it("setSourceType() transitions stage to 'ready'", () => {
    const fileType = { extension: ".pdf", mimeType: "application/pdf" };
    useConverterStore.getState().setSourceType(fileType);
    expect(useConverterStore.getState().stage).toBe("ready");
    expect(useConverterStore.getState().sourceType).toEqual(fileType);
  });

  it("startConversion() transitions stage to 'converting' and clears error", () => {
    // Set up an error state first
    useConverterStore.setState({ stage: "error", error: "some error" });
    useConverterStore.getState().startConversion();
    const state = useConverterStore.getState();
    expect(state.stage).toBe("converting");
    expect(state.error).toBeNull();
  });

  it("completeConversion() stores blob + filename and sets stage to 'completed'", () => {
    const blob = new Blob(["fake-pdf"], { type: "application/pdf" });
    useConverterStore.getState().completeConversion(blob, "output.pdf");
    const state = useConverterStore.getState();
    expect(state.stage).toBe("completed");
    expect(state.outputFile).toBe(blob);
    expect(state.outputFileName).toBe("output.pdf");
  });

  it("completeConversion() with no filename sets outputFileName to null", () => {
    const blob = new Blob(["fake-pdf"]);
    useConverterStore.getState().completeConversion(blob, undefined);
    expect(useConverterStore.getState().outputFileName).toBeNull();
  });

  it("setError() sets error message and transitions stage to 'error'", () => {
    useConverterStore.getState().setError("Connection refused");
    const state = useConverterStore.getState();
    expect(state.stage).toBe("error");
    expect(state.error).toBe("Connection refused");
  });

  it("reset() clears everything back to idle", () => {
    const fakeFile = new File(["content"], "test.pdf");
    useConverterStore.setState({
      stage: "completed",
      file: fakeFile,
      outputFile: new Blob(["output"]),
      outputFileName: "out.pdf",
      error: "old error",
    });
    useConverterStore.getState().reset();
    const state = useConverterStore.getState();
    expect(state.stage).toBe("idle");
    expect(state.file).toBeNull();
    expect(state.outputFile).toBeNull();
    expect(state.outputFileName).toBeNull();
    expect(state.error).toBeNull();
  });

  it("resetConversion() clears output/error but keeps file and transitions to 'ready'", () => {
    const fakeFile = new File(["content"], "test.pdf");
    useConverterStore.setState({
      stage: "error",
      file: fakeFile,
      outputFile: new Blob(["output"]),
      outputFileName: "out.pdf",
      error: "some error",
    });
    useConverterStore.getState().resetConversion();
    const state = useConverterStore.getState();
    expect(state.stage).toBe("ready");
    expect(state.file).toBe(fakeFile); // file is preserved
    expect(state.outputFile).toBeNull();
    expect(state.outputFileName).toBeNull();
    expect(state.error).toBeNull();
  });

  it("startDetection() transitions to 'detecting' and clears error", () => {
    useConverterStore.setState({ stage: "error", error: "stale error" });
    useConverterStore.getState().startDetection();
    const state = useConverterStore.getState();
    expect(state.stage).toBe("detecting");
    expect(state.error).toBeNull();
  });
});
