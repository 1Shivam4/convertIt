import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversionStatus from "@/components/pdf-converter/ConversionStatus";
import { ConverterStage } from "@/app/utils/typeDefinitions";

const defaultProps = {
  stage: "ready" as ConverterStage,
  formatName: "Word Document",
  formatExtension: ".docx",
  outputFile: null,
  outputFileName: null,
  error: null,
  onConvertSubmit: vi.fn(),
  onCancelRequest: vi.fn(),
  onResetConversion: vi.fn(),
};

describe("ConversionStatus", () => {
  it("'ready' stage shows the Convert button with the format name", () => {
    render(<ConversionStatus {...defaultProps} stage="ready" />);
    expect(screen.getByText(/Convert to Word Document/i)).toBeInTheDocument();
  });

  it("'error' stage shows the error message and still shows the Convert button", () => {
    render(
      <ConversionStatus
        {...defaultProps}
        stage="error"
        error="Conversion failed: timeout"
      />
    );
    expect(screen.getByText("Conversion failed: timeout")).toBeInTheDocument();
    // Match the heading element exactly (not the error message which also contains "Conversion fail...")
    expect(screen.getByText("Conversion Failed")).toBeInTheDocument();
    expect(screen.getByText(/Convert to Word Document/i)).toBeInTheDocument();
  });

  it("'converting' stage shows spinner and Cancel button", () => {
    render(<ConversionStatus {...defaultProps} stage="converting" />);
    expect(screen.getByText("Converting document...")).toBeInTheDocument();
    expect(screen.getByText(/Cancel Conversion/i)).toBeInTheDocument();
    // Convert button should NOT appear during conversion
    expect(screen.queryByText(/Convert to/i)).toBeNull();
  });

  it("'completed' stage shows Download File and Convert Another buttons", () => {
    const blob = new Blob(["fake-pdf"], { type: "application/pdf" });
    render(
      <ConversionStatus
        {...defaultProps}
        stage="completed"
        outputFile={blob}
        outputFileName="test_docx.docx"
      />
    );
    expect(screen.getByText(/Conversion Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Download File/i)).toBeInTheDocument();
    expect(screen.getByText(/Convert Another/i)).toBeInTheDocument();
    expect(screen.getByText("test_docx.docx")).toBeInTheDocument();
  });

  it("'completed' uses default filename when outputFileName is null", () => {
    const blob = new Blob(["fake-pdf"]);
    render(
      <ConversionStatus
        {...defaultProps}
        stage="completed"
        outputFile={blob}
        outputFileName={null}
      />
    );
    // Falls back to `converted${formatExtension}`
    expect(screen.getByText("converted.docx")).toBeInTheDocument();
  });

  it("clicking Cancel calls onCancelRequest", () => {
    const onCancelRequest = vi.fn();
    render(
      <ConversionStatus
        {...defaultProps}
        stage="converting"
        onCancelRequest={onCancelRequest}
      />
    );
    fireEvent.click(screen.getByText(/Cancel Conversion/i));
    expect(onCancelRequest).toHaveBeenCalledTimes(1);
  });

  it("clicking Convert button calls onConvertSubmit", () => {
    const onConvertSubmit = vi.fn();
    render(
      <ConversionStatus
        {...defaultProps}
        stage="ready"
        onConvertSubmit={onConvertSubmit}
      />
    );
    fireEvent.click(screen.getByText(/Convert to Word Document/i));
    expect(onConvertSubmit).toHaveBeenCalledTimes(1);
  });

  it("clicking Convert Another calls onResetConversion", () => {
    const onResetConversion = vi.fn();
    const blob = new Blob(["fake-pdf"]);
    render(
      <ConversionStatus
        {...defaultProps}
        stage="completed"
        outputFile={blob}
        onResetConversion={onResetConversion}
      />
    );
    fireEvent.click(screen.getByText(/Convert Another/i));
    expect(onResetConversion).toHaveBeenCalledTimes(1);
  });

  it("'error' stage with no error string does not show the error box", () => {
    render(<ConversionStatus {...defaultProps} stage="error" error={null} />);
    expect(screen.queryByText(/Conversion Failed/i)).toBeNull();
  });
});
