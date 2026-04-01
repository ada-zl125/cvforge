"use client";

import { ChevronDown, ChevronUp, Plus, Trash2, Mail, Phone, MapPin, Globe } from "lucide-react";
import type { PersonalInfo, ContactField, ContactFieldType, ResumeLanguage } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PhotoUpload } from "@/components/editor/PhotoUpload";

const CONTACT_META: Record<ContactFieldType, { icon: typeof Mail; label: string; labelZh: string; unique: boolean }> = {
  email:    { icon: Mail,   label: "Email",    labelZh: "邮箱", unique: true },
  phone:    { icon: Phone,  label: "Phone",    labelZh: "电话", unique: true },
  location: { icon: MapPin, label: "Location", labelZh: "地点", unique: true },
  website:  { icon: Globe,  label: "Website",  labelZh: "网站", unique: false },
};

interface PersonalSectionProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  language: ResumeLanguage;
}

export function PersonalSection({ data: rawData, onChange, collapsed, onToggleCollapse, language }: PersonalSectionProps) {
  const data: PersonalInfo = { ...rawData, contacts: rawData.contacts ?? [] };

  function updateName(fullName: string) {
    onChange({ ...data, fullName });
  }

  function updateContact(id: string, patch: Partial<ContactField>) {
    onChange({
      ...data,
      contacts: data.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function addContact(type: ContactFieldType) {
    const field: ContactField = {
      id: crypto.randomUUID(),
      type,
      value: "",
      ...(type === "phone" ? { countryCode: "+1" } : {}),
      ...(type === "website" ? { label: "" } : {}),
    };
    onChange({ ...data, contacts: [...data.contacts, field] });
  }

  function removeContact(id: string) {
    onChange({ ...data, contacts: data.contacts.filter((c) => c.id !== id) });
  }

  function moveContact(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= data.contacts.length) return;
    const next = [...data.contacts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...data, contacts: next });
  }

  // Hide unique field types that are already added
  const addableTypes = (Object.keys(CONTACT_META) as ContactFieldType[]).filter((type) => {
    const meta = CONTACT_META[type];
    if (!meta.unique) return true;
    return !data.contacts.some((c) => c.type === type);
  });

  const zh = language === "zh";

  return (
    <section className="section-card rounded-lg border border-border">
      {/* Section header — always visible */}
      <button
        type="button"
        className="section-header flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold tracking-tight"
        onClick={onToggleCollapse}
      >
        {zh ? "个人信息" : "Personal Information"}
        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Photo upload */}
          <PhotoUpload
            photo={data.photo}
            onChange={(photo) => onChange({ ...data, photo })}
            language={language}
          />

          {/* Full Name — always present, not removable */}
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="fullName">{zh ? "姓名" : "Full Name"}</Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => updateName(e.target.value)}
              placeholder={zh ? "姓名" : "Your Name"}
            />
          </div>

          {/* Dynamic contact fields */}
          {data.contacts.length > 0 && (
            <div className="mb-3 space-y-3">
              {data.contacts.map((field, i) => (
                <ContactFieldRow
                  key={field.id}
                  field={field}
                  isFirst={i === 0}
                  isLast={i === data.contacts.length - 1}
                  onUpdate={(patch) => updateContact(field.id, patch)}
                  onRemove={() => removeContact(field.id)}
                  onMoveUp={() => moveContact(i, -1)}
                  onMoveDown={() => moveContact(i, 1)}
                  language={language}
                />
              ))}
            </div>
          )}

          {/* Add contact field dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="add-btn inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Plus className="size-3" />
              {zh ? "添加字段" : "Add field"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4}>
              {addableTypes.map((type) => {
                const meta = CONTACT_META[type];
                return (
                  <DropdownMenuItem
                    key={type}
                    className="cursor-pointer gap-2"
                    onClick={() => addContact(type)}
                  >
                    <meta.icon className="size-4" />
                    {zh ? meta.labelZh : meta.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact field row                                                   */
/* ------------------------------------------------------------------ */

function ContactFieldRow({
  field,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  language,
}: {
  field: ContactField;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<ContactField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  language: ResumeLanguage;
}) {
  const meta = CONTACT_META[field.type];
  const zh = language === "zh";

  return (
    <div className="flex items-end gap-2">
      {/* Move up/down buttons */}
      <div className="mb-0.5 flex flex-col">
        <Button
          variant="ghost"
          size="icon-xs"
          className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <meta.icon className="size-3" />
          {zh ? meta.labelZh : meta.label}
        </Label>

        {field.type === "phone" ? (
          <div className="flex gap-2">
            <Input
              className="w-20"
              value={field.countryCode ?? ""}
              onChange={(e) => onUpdate({ countryCode: e.target.value })}
              placeholder="+86"
            />
            <Input
              className="flex-1"
              value={field.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder={zh ? "13812345678" : "7123456789"}
            />
          </div>
        ) : field.type === "website" ? (
          <div className="flex gap-2">
            <Input
              className="w-28"
              value={field.label ?? ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="GitHub"
            />
            <Input
              className="flex-1"
              value={field.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="https://github.com/username"
            />
          </div>
        ) : (
          <Input
            value={field.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder={
              field.type === "email"
                ? "example@email.com"
                : zh
                ? "北京, 中国"
                : "London, UK"
            }
          />
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        className="mb-0.5 cursor-pointer text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}
