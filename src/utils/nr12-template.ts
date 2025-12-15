import { ChecklistChapter } from '../App';

export const NR12_TEMPLATE: ChecklistChapter[] = [
  {
    id: 'chapter-1',
    title: '1. Arranjos Físicos e Instalações',
    items: [
      {
        id: 'item-1-1',
        text: 'As zonas de perigo das máquinas e equipamentos possuem sistemas de segurança?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-1-2',
        text: 'Os espaços ao redor das máquinas são adequados para instalação, operação e manutenção?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-1-3',
        text: 'O piso está nivelado e possui resistência compatível com as cargas solicitadas?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-1-4',
        text: 'As áreas de circulação estão devidamente demarcadas?',
        status: 'pending',
        mandatory: false,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-2',
    title: '2. Instalações e Dispositivos Elétricos',
    items: [
      {
        id: 'item-2-1',
        text: 'As instalações elétricas atendem às normas técnicas vigentes (NR-10)?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-2-2',
        text: 'Os quadros elétricos estão identificados e possuem dispositivos de bloqueio?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-2-3',
        text: 'Existe sistema de aterramento das máquinas e equipamentos?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-2-4',
        text: 'Os dispositivos de partida e parada estão identificados e de fácil acesso?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-3',
    title: '3. Dispositivos de Partida, Acionamento e Parada',
    items: [
      {
        id: 'item-3-1',
        text: 'As máquinas possuem botão de parada de emergência?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-3-2',
        text: 'O acionamento por comando bimanual está implementado quando necessário?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-3-3',
        text: 'Os dispositivos de parada são de fácil acesso e visualização?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-3-4',
        text: 'Existe sistema de bloqueio para impedir partida acidental?',
        status: 'pending',
        mandatory: false,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-4',
    title: '4. Sistemas de Segurança',
    items: [
      {
        id: 'item-4-1',
        text: 'As proteções fixas estão instaladas e em bom estado de conservação?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-4-2',
        text: 'As proteções móveis possuem intertravamento?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-4-3',
        text: 'Existe cortina de luz ou sensor de presença nas zonas de perigo?',
        status: 'pending',
        mandatory: false,
        observations: '',
      },
      {
        id: 'item-4-4',
        text: 'Os sistemas de segurança são testados periodicamente?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-5',
    title: '5. Dispositivos de Parada de Emergência',
    items: [
      {
        id: 'item-5-1',
        text: 'Todos os equipamentos possuem botão de parada de emergência?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-5-2',
        text: 'Os botões de emergência estão posicionados adequadamente?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-5-3',
        text: 'A parada de emergência interrompe todas as funções perigosas?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-6',
    title: '6. Sinalização',
    items: [
      {
        id: 'item-6-1',
        text: 'As máquinas possuem sinalização de segurança adequada?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-6-2',
        text: 'Existe sinalização de advertência nas áreas de risco?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-6-3',
        text: 'As sinalizações estão em conformidade com a NR-26?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-7',
    title: '7. Manuais e Documentação',
    items: [
      {
        id: 'item-7-1',
        text: 'Existe manual de instruções em português?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-7-2',
        text: 'O manual contém informações sobre riscos e medidas de segurança?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-7-3',
        text: 'Existe procedimento de trabalho seguro documentado?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-7-4',
        text: 'Os manuais estão acessíveis aos operadores?',
        status: 'pending',
        mandatory: false,
        observations: '',
      },
    ],
  },
  {
    id: 'chapter-8',
    title: '8. Capacitação',
    items: [
      {
        id: 'item-8-1',
        text: 'Os operadores receberam capacitação específica conforme NR-12?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-8-2',
        text: 'Existe registro de treinamento e capacitação?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
      {
        id: 'item-8-3',
        text: 'O treinamento inclui procedimentos de emergência?',
        status: 'pending',
        mandatory: true,
        observations: '',
      },
    ],
  },
];

export function createNR12Checklist(title: string, userId: string) {
  return {
    id: crypto.randomUUID(),
    userId,
    title,
    chapters: NR12_TEMPLATE.map(chapter => ({
      ...chapter,
      items: chapter.items.map(item => ({ ...item })),
    })),
    createdAt: new Date().toISOString(),
  };
}
