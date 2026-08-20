"use client";

import { HelpCircle, BookOpen, MessageSquare, FileText, ExternalLink } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Help & Support</h2>
        <p className="mt-1 text-sm text-slate-500">Get help with using the IT Ticketing System</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HelpCard
          icon={BookOpen}
          title="Documentation"
          description="Read the user guide and learn how to use all features"
          link="#"
        />
        <HelpCard
          icon={MessageSquare}
          title="Contact Support"
          description="Get in touch with the IT support team"
          link="#"
        />
        <HelpCard
          icon={FileText}
          title="FAQ"
          description="Find answers to commonly asked questions"
          link="#"
        />
        <HelpCard
          icon={HelpCircle}
          title="Report an Issue"
          description="Report a bug or request a feature"
          link="#"
        />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Quick Start Guide</h3>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">1</span>
            <span>Create a new ticket by clicking the "+ New Ticket" button on the dashboard</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">2</span>
            <span>Select the ticket type and fill in the title and description</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">3</span>
            <span>Once created, the ticket will appear in the Unassigned queue</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">4</span>
            <span>Assign the ticket to yourself or a team member</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">5</span>
            <span>Update the status as you work on the ticket</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">6</span>
            <span>Escalate to the next department if needed</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function HelpCard({
  icon: Icon,
  title,
  description,
  link,
}: {
  icon: any;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <a
      href={link}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </a>
  );
}
