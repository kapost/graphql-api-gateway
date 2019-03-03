export default async function currentUserResolver(_obj, _args, context) {
  const response = await context.models.currentUser.get();
  return response.data();
}
