import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ToolOptions from "@/components/pdf-converter/ToolOptions";
import {
  pdfConverterSchema,
  PDFConverterFormValues,
} from "@/app/lib/schemas/pdfConverterSchema";

// Wrapper that provides real react-hook-form context to ToolOptions
function ToolOptionsWrapper({
  selectedFormatId,
  disabled = false,
  rotateAngle = "90",
  pdfaVersion = "PDF/A-1b",
}: {
  selectedFormatId: string;
  disabled?: boolean;
  rotateAngle?: string;
  pdfaVersion?: string;
}) {
  const { register, formState: { errors }, setValue } = useForm<PDFConverterFormValues>({
    resolver: zodResolver(pdfConverterSchema),
    defaultValues: {
      selectedFormatId,
      rotateAngle: "90",
      pdfaVersion: "PDF/A-1b",
      password: "",
    },
  });

  return (
    <ToolOptions
      selectedFormatId={selectedFormatId}
      register={register}
      errors={errors}
      setValue={setValue}
      watchRotateAngle={rotateAngle}
      watchPdfaVersion={pdfaVersion}
      disabled={disabled}
    />
  );
}

describe("ToolOptions", () => {
  it("renders password input for 'encrypt'", () => {
    render(<ToolOptionsWrapper selectedFormatId="encrypt" />);
    expect(screen.getByPlaceholderText(/Enter protective password/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter Password to Secure PDF/i)).toBeInTheDocument();
  });

  it("renders password input for 'decrypt'", () => {
    render(<ToolOptionsWrapper selectedFormatId="decrypt" />);
    expect(screen.getByPlaceholderText(/Enter existing password to unlock/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter Current PDF Password/i)).toBeInTheDocument();
  });

  it("decrypt shows legal warning notice", () => {
    render(<ToolOptionsWrapper selectedFormatId="decrypt" />);
    expect(screen.getByText(/Only unlock PDFs you own/i)).toBeInTheDocument();
  });

  it("renders rotation angle buttons (90°, 180°, 270°) for 'rotate'", () => {
    render(<ToolOptionsWrapper selectedFormatId="rotate" />);
    expect(screen.getByText(/90° Clockwise/i)).toBeInTheDocument();
    expect(screen.getByText(/180° Clockwise/i)).toBeInTheDocument();
    expect(screen.getByText(/270° Clockwise/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Rotation Angle/i)).toBeInTheDocument();
  });

  it("renders PDF/A version buttons for 'pdfa'", () => {
    render(<ToolOptionsWrapper selectedFormatId="pdfa" />);
    expect(screen.getByText("PDF/A-1b")).toBeInTheDocument();
    expect(screen.getByText("PDF/A-2b")).toBeInTheDocument();
    expect(screen.getByText("PDF/A-3b")).toBeInTheDocument();
    expect(screen.getByText(/Select PDF\/A ISO Standard/i)).toBeInTheDocument();
  });

  it("returns null (renders nothing) for a standard document format like 'docx'", () => {
    const { container } = render(<ToolOptionsWrapper selectedFormatId="docx" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null for 'compress'", () => {
    const { container } = render(<ToolOptionsWrapper selectedFormatId="compress" />);
    expect(container.firstChild).toBeNull();
  });

  it("password input is disabled when disabled=true", () => {
    render(<ToolOptionsWrapper selectedFormatId="encrypt" disabled={true} />);
    const input = screen.getByPlaceholderText(/Enter protective password/i);
    expect(input).toBeDisabled();
  });

  it("rotation buttons are disabled when disabled=true", () => {
    render(<ToolOptionsWrapper selectedFormatId="rotate" disabled={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("renders page range input for 'split'", () => {
    render(<ToolOptionsWrapper selectedFormatId="split" />);
    expect(screen.getByPlaceholderText(/1-3, 5, 8-10/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter Page Range to Extract/i)).toBeInTheDocument();
  });

  it("currently selected rotation angle button is visually highlighted", () => {
    render(<ToolOptionsWrapper selectedFormatId="rotate" rotateAngle="180" />);
    const btn180 = screen.getByText(/180° Clockwise/i);
    // The selected button gets bg-red-600 class
    expect(btn180.className).toContain("bg-red-600");
  });
});
