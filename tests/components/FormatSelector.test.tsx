import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FormatSelector from "@/components/pdf-converter/FormatSelector";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";

const defaultProps = {
  selectedFormatId: "docx",
  activeCategory: "all" as const,
  disabled: false,
  onSelectFormat: vi.fn(),
  onCategoryChange: vi.fn(),
};

describe("FormatSelector", () => {
  it("renders all format option tiles when category is 'all'", () => {
    render(<FormatSelector {...defaultProps} />);
    // Every format name should appear in the tile grid
    PDF_FORMAT_OPTIONS.forEach((fmt) => {
      expect(screen.getAllByText(fmt.name).length).toBeGreaterThan(0);
    });
  });

  it("renders category filter tabs (All Formats, Documents, PDF Tools)", () => {
    render(<FormatSelector {...defaultProps} />);
    expect(screen.getByText("All Formats")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("PDF Tools & Archival")).toBeInTheDocument();
  });

  it("clicking a format tile calls onSelectFormat with the correct id", () => {
    const onSelectFormat = vi.fn();
    render(<FormatSelector {...defaultProps} onSelectFormat={onSelectFormat} />);
    // Click "Compress PDF" tile
    const compressButtons = screen.getAllByText("Compress PDF");
    fireEvent.click(compressButtons[0]);
    expect(onSelectFormat).toHaveBeenCalledWith("compress");
  });

  it("clicking a category tab calls onCategoryChange with the correct value", () => {
    const onCategoryChange = vi.fn();
    render(<FormatSelector {...defaultProps} onCategoryChange={onCategoryChange} />);
    fireEvent.click(screen.getByText("Documents"));
    expect(onCategoryChange).toHaveBeenCalledWith("document");
  });

  it("filters to only document formats when activeCategory is 'document'", () => {
    render(<FormatSelector {...defaultProps} activeCategory="document" />);
    const documentFormats = PDF_FORMAT_OPTIONS.filter((f) => f.category === "document");
    const toolFormats = PDF_FORMAT_OPTIONS.filter((f) => f.category === "tools");

    documentFormats.forEach((fmt) => {
      expect(screen.getAllByText(fmt.name).length).toBeGreaterThan(0);
    });
    toolFormats.forEach((fmt) => {
      expect(screen.queryByText(fmt.name)).toBeNull();
    });
  });

  it("filters to only tool formats when activeCategory is 'tools'", () => {
    render(<FormatSelector {...defaultProps} activeCategory="tools" />);
    const toolFormats = PDF_FORMAT_OPTIONS.filter((f) => f.category === "tools");
    const documentFormats = PDF_FORMAT_OPTIONS.filter((f) => f.category === "document");

    toolFormats.forEach((fmt) => {
      expect(screen.getAllByText(fmt.name).length).toBeGreaterThan(0);
    });
    documentFormats.forEach((fmt) => {
      expect(screen.queryByText(fmt.name)).toBeNull();
    });
  });

  it("all tile buttons are disabled when disabled=true", () => {
    render(<FormatSelector {...defaultProps} disabled={true} />);
    const buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("type") === "button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("select dropdown changes call onSelectFormat with selected value", () => {
    const onSelectFormat = vi.fn();
    render(<FormatSelector {...defaultProps} onSelectFormat={onSelectFormat} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "compress" } });
    expect(onSelectFormat).toHaveBeenCalledWith("compress");
  });
});
