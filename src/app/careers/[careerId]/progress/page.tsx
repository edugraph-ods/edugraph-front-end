"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCareer } from "@/presentation/hooks/useCareer";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/domain/entities/progress";

export default function CareerProgressPage() {
  const params = useParams();
  const careerId = useMemo(() => {
    const id = params?.careerId;
    return typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  }, [params]);

  const { calculateAcademicProgress } = useCareer();

  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(
      {
        max_credits: 7,
        cycles: [
          {
            cycle: 1,
            courses: [
              { id: "c-1", name: "Curso A", credits: 4, prereqs: [], status: "NOT_STARTED" },
              { id: "c-2", name: "Curso B", credits: 3, prereqs: [], status: "NOT_STARTED" },
            ],
          },
          {
            cycle: 2,
            courses: [
              { id: "c-3", name: "Curso C", credits: 4, prereqs: ["c-1"], status: "NOT_STARTED" },
            ],
          },
        ],
      },
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AcademicProgressResponse | null>(null);

  const onCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed = JSON.parse(payloadText) as AcademicProgressRequest;
      if (!careerId) throw new Error("careerId inválido en la ruta");
      const response = await calculateAcademicProgress(careerId, parsed);
      setResult(response);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Progreso Académico</h1>
      <p className="text-sm text-gray-600">Career ID: <span className="font-mono">{careerId || "(no definido)"}</span></p>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Payload (JSON)</label>
        <textarea
          className="w-full h-64 p-3 border rounded font-mono text-sm"
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          spellCheck={false}
        />
        <div className="flex gap-3">
          <button
            onClick={onCalculate}
            disabled={loading || !careerId}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {result && (
        <div className="rounded border p-4 bg-white">
          <h2 className="font-medium mb-3">Resultado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded border p-3">
              <div className="text-gray-500">Ciclos necesarios</div>
              <div className="text-lg font-semibold">{result.cycles_needed_to_graduate}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-gray-500">Meses necesarios</div>
              <div className="text-lg font-semibold">{result.months_needed_to_graduate}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-gray-500">Años necesarios</div>
              <div className="text-lg font-semibold">{result.years_needed_to_graduate}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
