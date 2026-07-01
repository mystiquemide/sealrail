export type WorkflowListItem = {
  name: string;
  steps: string;
  split: string;
  state: string;
  stateColor: string;
  href: string;
};

export const WORKFLOWS: WorkflowListItem[] = [
  {
    name: "Invoice Settlement",
    steps: "3",
    split: "60 / 30 / 10",
    state: "Active",
    stateColor: "#64D96B",
    href: "/workflows/invoice_settlement",
  },
];
