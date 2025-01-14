const styles: Dictionary<{ default: string }> = import.meta.glob('./**/*.less', {
  eager: true,
  query: '?inline',
});
const cssContent = Object.values(styles)
  .map((m) => m.default)
  .join('\n\n');
export default cssContent;
