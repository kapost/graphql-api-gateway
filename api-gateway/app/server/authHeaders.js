export default function authHeaders(request) {
  const jwtHeader = request.header("authorization");
  const cookieHeader = request.header("cookie");

  if (jwtHeader) {
    return { Authorization: jwtHeader };
  } else if (cookieHeader) {
    return { Cookie: cookieHeader };
  }

  return {};
}
