export default function resolver(_obj, _arg, context) {
  return context.models.apiError.test403();
}
