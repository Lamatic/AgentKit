"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import type { ProjectDetails } from "@/lib/types";

interface Props {
  onComplete: () => void;
}

const INITIAL: ProjectDetails = {
  freelancer_name: "",
  freelancer_country: "",
  freelancer_payment_method: "Wise",
  freelancer_primary_concern: "getting_paid",
  freelancer_address: "",
  freelancer_email: "",
  freelancer_payment_details: "",
  client_name: "",
  client_country: "",
  client_type: "company",
  client_address: "",
  client_email: "",
  project_title: "",
  project_description: "",
  deliverables: "",
  timeline_start: "",
  timeline_end: "",
  payment_structure: "fixed",
  payment_currency: "USD",
  work_type: "code",
  field: "",
  experience_level: "mid-level",
  years_of_experience: "",
};

export default function Step1ProjectDetails({ onComplete }: Props) {
  const [form, setForm] = useState<ProjectDetails>(INITIAL);

  // Restore from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session.projectDetails) {
      setForm((prev) => ({ ...prev, ...session.projectDetails }));
    }
  }, []);

  const set = (key: keyof ProjectDetails, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSession({ projectDetails: form });
    onComplete();
  };

  const inputClass =
    "w-full px-5 py-3.5 bg-[#050508]/40 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]";
  const selectClass =
    "w-full px-5 py-3.5 bg-[#050508]/40 backdrop-blur-md border border-white/10 rounded-xl text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 appearance-none cursor-pointer shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]";
  const labelClass = "block text-[13px] font-medium text-white/70 mb-2 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.04em] mb-3 text-white">
          <span className="font-medium text-gradient-animate">Project</span> Details
        </h2>
        <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.1rem)]">
          Tell us about yourself, your client, and the scope of work.
        </p>
      </div>

      {/* ─── Section A: About You ─── */}
      <section className="space-y-6">
        <h3 className="text-xl font-medium text-white/90 border-b border-white/10 pb-3 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent text-sm">1</span>
          About You
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Your Name *</label>
            <input
              required
              className={inputClass}
              placeholder="Jane Doe"
              value={form.freelancer_name}
              onChange={(e) => set("freelancer_name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Your Country *</label>
            <input
              required
              className={inputClass}
              placeholder="Nigeria"
              value={form.freelancer_country}
              onChange={(e) => set("freelancer_country", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Your Email *</label>
            <input
              required
              type="email"
              className={inputClass}
              placeholder="jane@example.com"
              value={form.freelancer_email}
              onChange={(e) => set("freelancer_email", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Field of Work *</label>
            <input
              required
              className={inputClass}
              placeholder="e.g. frontend development"
              value={form.field}
              onChange={(e) => set("field", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Your Address *</label>
          <textarea
            required
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="Street, City, State"
            value={form.freelancer_address}
            onChange={(e) => set("freelancer_address", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Work Type *</label>
            <select
              className={selectClass}
              value={form.work_type}
              onChange={(e) => set("work_type", e.target.value)}
            >
              <option value="code">Code</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Experience Level *</label>
            <select
              className={selectClass}
              value={form.experience_level}
              onChange={(e) => set("experience_level", e.target.value)}
            >
              <option value="junior">Junior</option>
              <option value="mid-level">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Years of Experience *</label>
            <input
              required
              type="number"
              min="0"
              className={inputClass}
              placeholder="5"
              value={form.years_of_experience}
              onChange={(e) => set("years_of_experience", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Payment Method *</label>
            <select
              className={selectClass}
              value={form.freelancer_payment_method}
              onChange={(e) => set("freelancer_payment_method", e.target.value)}
            >
              <option value="Wise">Wise</option>
              <option value="Payoneer">Payoneer</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Payment Account Details *</label>
          <textarea
            required
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="e.g. Wise email: jane@example.com"
            value={form.freelancer_payment_details}
            onChange={(e) => set("freelancer_payment_details", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Primary Concern *</label>
          <select
            className={selectClass}
            value={form.freelancer_primary_concern}
            onChange={(e) => set("freelancer_primary_concern", e.target.value)}
          >
            <option value="getting_paid">Getting Paid</option>
            <option value="IP_ownership">IP Ownership</option>
            <option value="scope_creep">Scope Creep</option>
            <option value="disputes">Disputes</option>
          </select>
        </div>
      </section>

      {/* ─── Section B: About the Client ─── */}
      <section className="space-y-6">
        <h3 className="text-xl font-medium text-white/90 border-b border-white/10 pb-3 flex items-center gap-3 mt-10">
          <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent text-sm">2</span>
          About the Client
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Name *</label>
            <input
              required
              className={inputClass}
              placeholder="Acme Corp"
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Client Country *</label>
            <input
              required
              className={inputClass}
              placeholder="United States"
              value={form.client_country}
              onChange={(e) => set("client_country", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Email *</label>
            <input
              required
              type="email"
              className={inputClass}
              placeholder="client@acme.com"
              value={form.client_email}
              onChange={(e) => set("client_email", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Client Type *</label>
            <select
              className={selectClass}
              value={form.client_type}
              onChange={(e) => set("client_type", e.target.value)}
            >
              <option value="individual" className="bg-[#14141a]">Individual</option>
              <option value="company" className="bg-[#14141a]">Company</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Client Address *</label>
          <textarea
            required
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="Street, City, State"
            value={form.client_address}
            onChange={(e) => set("client_address", e.target.value)}
          />
        </div>
      </section>

      {/* ─── Section C: About the Project ─── */}
      <section className="space-y-6">
        <h3 className="text-xl font-medium text-white/90 border-b border-white/10 pb-3 flex items-center gap-3 mt-10">
          <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent text-sm">3</span>
          About the Project
        </h3>

        <div>
          <label className={labelClass}>Project Title *</label>
          <input
            required
            className={inputClass}
            placeholder="Landing Page Redesign"
            value={form.project_title}
            onChange={(e) => set("project_title", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Project Description *</label>
          <textarea
            required
            rows={4}
            className={inputClass + " resize-none"}
            placeholder="Describe the scope and goals of this project..."
            value={form.project_description}
            onChange={(e) => set("project_description", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Deliverables *</label>
          <textarea
            required
            rows={3}
            className={inputClass + " resize-none"}
            placeholder="Separate each deliverable with a comma"
            value={form.deliverables}
            onChange={(e) => set("deliverables", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date *</label>
            <input
              required
              type="date"
              className={inputClass}
              value={form.timeline_start}
              onChange={(e) => set("timeline_start", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>End Date *</label>
            <input
              required
              type="date"
              className={inputClass}
              value={form.timeline_end}
              onChange={(e) => set("timeline_end", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Payment Structure *</label>
            <select
              className={selectClass}
              value={form.payment_structure}
              onChange={(e) => set("payment_structure", e.target.value)}
            >
              <option value="fixed" className="bg-[#14141a]">Fixed</option>
              <option value="milestone" className="bg-[#14141a]">Milestone</option>
              <option value="hourly" className="bg-[#14141a]">Hourly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Payment Currency *</label>
            <select
              className={selectClass}
              value={form.payment_currency}
              onChange={(e) => set("payment_currency", e.target.value)}
            >
              <option value="USD" className="bg-[#14141a]">USD</option>
              <option value="GBP" className="bg-[#14141a]">GBP</option>
              <option value="EUR" className="bg-[#14141a]">EUR</option>
              <option value="NGN" className="bg-[#14141a]">NGN</option>
              <option value="INR" className="bg-[#14141a]">INR</option>
              <option value="CAD" className="bg-[#14141a]">CAD</option>
              <option value="AUD" className="bg-[#14141a]">AUD</option>
            </select>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="pt-6">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 px-8 py-4 liquid-glass-pill hover:bg-white/10 text-white font-medium transition-all duration-300 hover:!translate-y-0"
        >
          Continue to Pricing
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
