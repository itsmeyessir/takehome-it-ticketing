"use client";

import { Settings, Bell, Shield, Palette, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your application preferences</p>
      </div>

      <div className="space-y-4">
        <SettingsCard
          icon={Bell}
          title="Notifications"
          description="Configure how you receive notifications"
          status="Active"
        />
        <SettingsCard
          icon={Shield}
          title="Security"
          description="Manage your password and security settings"
          status="Last changed 30 days ago"
        />
        <SettingsCard
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel of the application"
          status="Default theme"
        />
        <SettingsCard
          icon={Globe}
          title="Language & Region"
          description="Set your language and time zone preferences"
          status="English (US)"
        />
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: any;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-6 w-6 text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className="text-xs text-slate-400">{status}</span>
      </div>
    </div>
  );
}
