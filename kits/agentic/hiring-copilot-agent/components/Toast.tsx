"use client";

import { toast as sonnerToast } from "sonner";
import { poppins } from "@/app/fonts";
import type { ToastProps } from "@/lib/types";

export default function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast id={id} title={toast.title} description={toast.description} />
  ));
}

function Toast(props: ToastProps) {
  const { title } = props;

  return (
    <div className="h-[60px] bg-[#D0FF00] flex flex-col justify-center items-center rounded-full py-2 px-5">
      <div className={`text-black text-sm ` + poppins.className}>{title}</div>
    </div>
  );
}