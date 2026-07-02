import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskForm, type TaskFormFields } from "./TaskForm";

const FIELDS: TaskFormFields = {
  invoiceId: "INV-1030",
  amount: "12400",
  vendor: "Northwind Supply",
  buyer: "Atlas Retail",
  dueDate: "2026-07-30",
  terms: "Net 30",
  notes: "Recurring vendor.",
};

function render(fieldsLocked = false): string {
  return renderToStaticMarkup(
    createElement(TaskForm, {
      fields: FIELDS,
      onFieldChange: () => {},
      fieldsLocked,
      buttons: [{ n: "01", label: "Create payment task", variant: "primary", onClick: () => {} }],
    })
  );
}

describe("TaskForm", () => {
  it("associates every label with its input via htmlFor/id", () => {
    const html = render();
    for (const key of Object.keys(FIELDS)) {
      expect(html).toContain(`for="task-${key}"`);
      expect(html).toContain(`id="task-${key}"`);
    }
  });

  it("links every input to its helper text via aria-describedby", () => {
    const html = render();
    for (const key of Object.keys(FIELDS)) {
      expect(html).toContain(`aria-describedby="task-${key}-hint"`);
      expect(html).toContain(`id="task-${key}-hint"`);
    }
  });

  it("renders the helper hints and current values", () => {
    const html = render();
    expect(html).toContain("Who is billing.");
    expect(html).toContain("Who is paying.");
    expect(html).toContain("Optional context passed to the agent.");
    expect(html).toContain("INV-1030");
    expect(html).toContain("Northwind Supply");
  });

  it("marks inputs read-only once the task is created", () => {
    expect(render(false)).not.toMatch(/readonly=""/i);
    expect(render(true)).toMatch(/readonly=""/i);
  });
});
