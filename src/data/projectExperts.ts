export type UnitType = '1bed' | '2bed' | '3bed' | '4plus' | 'commercial';

interface Expert { name: string; required: boolean; }
interface PhaseGroupData { label: string; expertsByUnit: Record<UnitType, Expert[]>; }

export const phaseGroups: PhaseGroupData[] = [
  {
    label: 'Ph.1–2 · Ground & Foundation',
    expertsByUnit: {
      '1bed': [
        { name: 'Land surveyor', required: true },
        { name: 'Geotechnical engineer', required: true },
        { name: 'Site supervisor', required: true },
        { name: 'Quantity surveyor', required: true },
      ],
      '2bed': [
        { name: 'Land surveyor', required: true },
        { name: 'Geotechnical engineer', required: true },
        { name: 'Site supervisor', required: true },
        { name: 'Quantity surveyor', required: true },
        { name: 'Town planner / liaison', required: true },
      ],
      '3bed': [
        { name: 'Land surveyor', required: true },
        { name: 'Geotechnical engineer', required: true },
        { name: 'Site supervisor full-time', required: true },
        { name: 'Quantity surveyor', required: true },
        { name: 'Town planner / AMA liaison', required: true },
        { name: 'Architect / draughtsman', required: true },
      ],
      '4plus': [
        { name: 'Lead architect', required: true },
        { name: 'Land surveyor', required: true },
        { name: 'Geotechnical engineer', required: true },
        { name: 'Dedicated project manager', required: true },
        { name: 'Senior quantity surveyor', required: true },
        { name: 'Environmental consultant', required: false },
      ],
      'commercial': [
        { name: 'Commercial architect', required: true },
        { name: 'Town planner', required: true },
        { name: 'Geotechnical engineer', required: true },
        { name: 'QS commercial', required: true },
        { name: 'Fire safety engineer', required: true },
      ],
    },
  },
  {
    label: 'Ph.3–4 · Structure & Roof',
    expertsByUnit: {
      '1bed': [
        { name: 'Structural engineer', required: true },
        { name: 'Block layer / mason', required: true },
        { name: 'Roofing contractor', required: true },
        { name: 'Timber specialist', required: false },
      ],
      '2bed': [
        { name: 'Structural engineer', required: true },
        { name: 'Reinforcement team', required: true },
        { name: 'Mason / block layer', required: true },
        { name: 'Roofing contractor', required: true },
        { name: 'Timber/truss specialist', required: false },
      ],
      '3bed': [
        { name: 'Structural engineer', required: true },
        { name: 'Reinforcement (rebar) team', required: true },
        { name: 'Block layer / mason lead', required: true },
        { name: 'Roofing contractor', required: true },
        { name: 'Timber / truss specialist', required: true },
        { name: 'Site supervisor', required: true },
      ],
      '4plus': [
        { name: 'Structural engineer lead', required: true },
        { name: 'Civil engineer', required: true },
        { name: 'Reinforcement team extended', required: true },
        { name: 'Specialist roofing contractor', required: true },
        { name: 'Timber / steel specialist', required: true },
      ],
      'commercial': [
        { name: 'Commercial structural engineer', required: true },
        { name: 'Steel contractor', required: false },
        { name: 'Commercial roofing specialist', required: true },
      ],
    },
  },
  {
    label: 'Ph.5–6 · MEP & Plaster',
    expertsByUnit: {
      '1bed': [
        { name: 'Electrical engineer', required: true },
        { name: 'Licensed plumber', required: true },
        { name: 'MEP inspector', required: true },
        { name: 'Plasterer', required: true },
      ],
      '2bed': [
        { name: 'Electrical engineer', required: true },
        { name: 'Licensed plumber', required: true },
        { name: 'MEP inspector 3rd party', required: true },
        { name: 'Plasterer / renderer', required: true },
        { name: 'Floor screed specialist', required: true },
      ],
      '3bed': [
        { name: 'Electrical engineer', required: true },
        { name: 'Licensed plumber', required: true },
        { name: 'MEP inspector 3rd party', required: true },
        { name: 'Plasterer lead', required: true },
        { name: 'External render specialist', required: true },
        { name: 'Floor screed specialist', required: true },
      ],
      '4plus': [
        { name: 'MEP engineer full system', required: true },
        { name: 'Electrical contractor', required: true },
        { name: 'Plumbing contractor', required: true },
        { name: 'HVAC engineer', required: true },
        { name: 'Plastering team lead', required: true },
      ],
      'commercial': [
        { name: 'Commercial MEP engineer', required: true },
        { name: 'Fire suppression contractor', required: true },
        { name: 'Lift / elevator engineer', required: false },
        { name: 'Commercial plasterer', required: true },
      ],
    },
  },
  {
    label: 'Ph.7–8 · Finishes & Handover',
    expertsByUnit: {
      '1bed': [
        { name: 'Tiler', required: true },
        { name: 'Painter', required: true },
        { name: 'HVAC technician', required: false },
        { name: 'Landscaper', required: false },
      ],
      '2bed': [
        { name: 'Interior fit-out team', required: true },
        { name: 'Tiler floor & wall', required: true },
        { name: 'Joiner / carpenter', required: true },
        { name: 'Painter & decorator', required: true },
        { name: 'HVAC technician', required: false },
        { name: 'Landscaping contractor', required: false },
      ],
      '3bed': [
        { name: 'Interior fit-out lead', required: true },
        { name: 'Tiler floor & wall', required: true },
        { name: 'Joiner / carpenter', required: true },
        { name: 'Painter & decorator', required: true },
        { name: 'Kitchen fitter', required: true },
        { name: 'HVAC / AC technician', required: false },
        { name: 'Landscaping contractor', required: false },
        { name: 'ECG / GWCL liaison', required: true },
      ],
      '4plus': [
        { name: 'Interior designer', required: false },
        { name: 'Full fit-out team', required: true },
        { name: 'Smart home / AV contractor', required: false },
        { name: 'Landscaping full scope', required: true },
        { name: 'Security systems contractor', required: false },
      ],
      'commercial': [
        { name: 'Commercial fit-out contractor', required: true },
        { name: 'Access control engineer', required: true },
        { name: 'Commercial HVAC', required: true },
        { name: 'Compliance inspector', required: true },
      ],
    },
  },
];

export const getExpertsForUnitType = (unitType: UnitType) =>
  phaseGroups.map(pg => ({
    label: pg.label,
    experts: pg.expertsByUnit[unitType] || pg.expertsByUnit['3bed'],
  }));
