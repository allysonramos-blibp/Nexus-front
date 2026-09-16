import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileCheck, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText 
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";

interface ImportGabaritoDialogProps {
  open: boolean;
  onClose: () => void;
  planId: number;
}

export function ImportGabaritoDialog({ open, onClose, planId }: ImportGabaritoDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: (f: File) => api.importPlanAnswerKey(planId, f),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast(
        `Gabarito processado! ${data.totalAtualizado} questões foram atualizadas no plano.`,
        "success"
      );
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleClose() {
    setFile(null);
    importMutation.reset();
    onClose();
  }

  const result = importMutation.data;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Importar Gabarito Oficial"
      description="Envie o PDF oficial do gabarito para preencher as alternativas corretas e anulações pelo número da questão."
      className="max-w-xl"
    >
      {!result ? (
        <div className="flex flex-col gap-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-raised/40 p-8 text-center transition-colors hover:border-primary/50 hover:bg-surface-raised"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="size-6" />
            </span>
            {file ? (
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="size-4 text-primary" />
                <span className="font-semibold">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  Arraste o PDF do gabarito ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Reconhece tabelas estilo FGV, Cespe, FCC, listas 1 A, 2 B e anulações (*)
                </p>
              </>
            )}
          </div>

          {importMutation.isPending && (
            <Loading label="Lendo gabarito determinístico e associando às questões..." />
          )}

          {importMutation.error && <ErrorState error={importMutation.error} compact />}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!file || importMutation.isPending}
              onClick={() => file && importMutation.mutate(file)}
            >
              Processar Gabarito
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface-raised p-3 text-center">
              <p className="text-xs text-muted-foreground">Encontradas</p>
              <p className="text-xl font-bold text-foreground">{result.totalEncontrado}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-emerald-400">
              <p className="text-xs font-semibold">Atualizadas</p>
              <p className="text-xl font-bold">{result.totalAtualizado}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-amber-400">
              <p className="text-xs font-semibold">Anuladas (*)</p>
              <p className="text-xl font-bold">{result.numerosAnulados.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-3 text-center">
              <p className="text-xs text-muted-foreground">Sem Match</p>
              <p className="text-xl font-bold text-foreground">
                {result.questoesSemCorrespondencia.length}
              </p>
            </div>
          </div>

          {result.numerosAnulados.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                Questões anuladas identificadas: {result.numerosAnulados.join(", ")}.
              </span>
            </div>
          )}

          {result.numerosAusentesNoGabarito.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-raised p-3 text-xs text-muted-foreground">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <span>
                Questões cadastradas no plano sem gabarito correspondente no PDF:{" "}
                {result.numerosAusentesNoGabarito.join(", ")}.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="primary" onClick={handleClose}>
              Concluir
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
