import { getDB } from '@/lib/supabase';
import { InstructionsEditor } from '@/components/InstructionsEditor';

export const revalidate = 0;

export default async function SettingsPage() {
  const db = getDB();
  const [ideaInstructions, scriptInstructions] = await Promise.all([
    db.getSetting('idea_instructions'),
    db.getSetting('script_instructions'),
  ]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Instruções do Operador</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Diretrizes persistentes injetadas em cada geração de ideia e script.
          Use para corrigir tendências, impor estilos visuais ou reforçar regras criativas.
        </p>
      </div>

      <div className="space-y-6">
        <InstructionsEditor
          settingKey="idea_instructions"
          label="Instruções para Ideias"
          description="Incluído no prompt de geração de ideias. Afeta conceitos, temas e direção criativa."
          initialValue={ideaInstructions}
          accentColor="yellow"
        />

        <InstructionsEditor
          settingKey="script_instructions"
          label="Instruções para Scripts"
          description="Incluído no prompt de geração de scripts. Afeta visual, diálogo, direção de cena e produção."
          initialValue={scriptInstructions}
          accentColor="green"
        />
      </div>

      <div className="mt-8 bg-white/[0.03] rounded-2xl p-5">
        <div className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Como funciona</div>
        <ul className="text-xs text-white/35 space-y-2">
          <li>• As instruções são salvas no banco e carregadas automaticamente a cada geração</li>
          <li>• Deixe um campo vazio para não impor restrições naquele tipo</li>
          <li>• Mudanças entram em vigor na próxima geração — não retroagem</li>
          <li>• Seja específico: "corpo humano proporcional" &gt; "parecer humano"</li>
        </ul>
      </div>
    </div>
  );
}
