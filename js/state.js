export const state = {
  metadata: null,
  subjectPdf: null,
  indexPdf: null,
  subjectAnalysis: null,
  indexAnalysis: null,
  lcCandidates: [],
  selectedLC: new Map(),
  unesco: [],
};

export function resetState(){
  state.metadata = null;
  state.subjectPdf = null;
  state.indexPdf = null;
  state.subjectAnalysis = null;
  state.indexAnalysis = null;
  state.lcCandidates = [];
  state.selectedLC.clear();
  state.unesco = [];
}
