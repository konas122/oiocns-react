import CalcRefGraph from './CalcRefGraph';
import ValidateRefGraph from './ValidateRefGraph';

export type RefGraph = CalcRefGraph | ValidateRefGraph;

export { default as CalcRefGraph } from './CalcRefGraph';
export { default as ValidateRefGraph } from './ValidateRefGraph';
