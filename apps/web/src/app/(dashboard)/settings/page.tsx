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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Instruções do Operador</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Diretrizes persistentes injetadas em cada geração de ideia e script. Use para corrigir tendências,
          impor estilos visuais ou reforçar regras criativas.
        </p>
      </div>

      <div className="space-y-6">
        <InstructionsEditor
          settingKey="idea_instructions"
          label="Instruções para Ideias"
          description="Incluído no prompt de geração de ideias. Afeta conceitos, temas e direção criativa."
          placeholder={`Exemplos:
- Frutas com corpo humano DEVEM ter corpo humano real, proporcional — não cartoon nem vegetal deformado
- Evitar conceitos com animais a menos que seja o tema principal
- Priorizar personagens femininos em situações cotidianas absurdas
- Sempre incluir um elemento de surpresa no hook`}
          initialValue={ideaInstructions}
          accentColor="yellow"
        />

        <InstructionsEditor
          settingKey="script_instructions"
          label="Instruções para Scripts"
          description="Incluído no prompt de geração de scripts. Afeta visual, diálogo, direção de cena e produção."
          placeholder={`Exemplos:
- Personagens de frutas com corpo humano: mostrar corpo inteiro em pelo menos 1 cena
- Iluminação preferencial: luz natural de janela lateral, sombras suaves
- Diálogos em pt-BR informal, sem gírias muito regionais
- Cada cena deve ter movimento de câmera diferente da anterior`}
          initialValue={scriptInstructions}
          accentColor="green"
        />
      </div>

      <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Como funciona</div>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• As instruções são salvas no banco e carregadas automaticamente a cada geração</li>
          <li>• Deixe um campo vazio para não impor restrições naquele tipo</li>
          <li>• Mudanças entram em vigor na próxima geração — não retroagem</li>
          <li>• Seja específico: "corpo humano proporcional" &gt; "parecer humano"</li>
        </ul>
      </div>
    </div>
  );
}
