import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { AppShell, ErrorNote } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";


function EstudoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  const notes = useQuery({
    queryKey: ["notes", userId],
    queryFn: () => api.listNotes(userId!),
    enabled: !!userId,
  });

  const files = useQuery({
    queryKey: ["files", userId],
    queryFn: () => api.listFiles(userId!),
    enabled: !!userId,
  });

  const createNote = useMutation({
    mutationFn: () => api.createNote(userId!, titulo, conteudo),
    onSuccess: () => {
      setTitulo("");
      setConteudo("");
      qc.invalidateQueries({ queryKey: ["notes", userId] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: number) => api.deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", userId] }),
  });

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadFile(userId!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", userId] }),
  });

  const deleteFile = useMutation({
    mutationFn: (id: number) => api.deleteFile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", userId] }),
  });

  return (
    <AppShell title="Materiais" subtitle="Notas e arquivos de estudo">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Nova anotação</h2>
          <input
            placeholder="Título"
            aria-label="Título da anotação"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-study"
          />
          <textarea
            placeholder="Conteúdo…"
            aria-label="Conteúdo da anotação"
            rows={5}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="resize-y rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-study"
          />
          <button
            onClick={() => createNote.mutate()}
            disabled={!titulo || createNote.isPending}
            className="self-start rounded-lg bg-study px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Salvar nota
          </button>
          {createNote.error && <ErrorNote error={createNote.error} />}

          <ul className="flex flex-col gap-2">
            {(notes.data ?? []).map((n) => (
              <li key={n.id} className="rounded-lg border border-border/70 bg-surface-raised px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium">{n.titulo}</span>
                  <button
                    onClick={() => deleteNote.mutate(n.id)}
                    aria-label={`Excluir ${n.titulo}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {n.conteudo && (
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                    {n.conteudo}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {notes.error && <ErrorNote error={notes.error} />}
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Arquivos</h2>
          <input
            type="file"
            aria-label="Enviar arquivo de material"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
            className="mt-3 w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-raised file:px-3 file:py-2 file:text-xs file:text-foreground"
          />
          {upload.error && <ErrorNote error={upload.error} />}
          <ul className="mt-4 flex flex-col gap-2">
            {(files.data ?? []).map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-2.5"
              >
                <FileText className="size-4 text-study" />
                <span className="flex-1 truncate text-sm">{f.nomeOriginal}</span>
                <a
                  href={api.fileDownloadUrl(f.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Baixar ${f.nomeOriginal}`}
                >
                  <Download className="size-4" />
                </a>
                <button
                  onClick={() => deleteFile.mutate(f.id)}
                  aria-label={`Excluir ${f.nomeOriginal}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

export default EstudoPage;
