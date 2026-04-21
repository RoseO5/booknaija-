"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");

    if (!isAdmin) {
      router.push("/admin/login");
    } else {
      setAuthorized(true);
      loadQuestions();
    }
  }, []);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setQuestions(data);
    }
  };

  if (!authorized) {
    return <p className="p-6">Checking access...</p>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard 🧑‍🍳</h1>

      <button
        onClick={() => {
          localStorage.removeItem("isAdmin");
          router.push("/admin/login");
        }}
        className="mt-2 text-sm underline"
      >
        Logout
      </button>

      <div className="mt-6 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="p-4 border rounded">
            <p>{q.question}</p>
            <p className="text-xs text-gray-500">
              {new Date(q.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
