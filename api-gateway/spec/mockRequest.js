import sinon from "sinon";

const mockRequest = (options = {}) => {
  const ret = {};
  return Object.assign(ret, {
    accepts: sinon.stub().returns(ret),
    acceptsCharsets: sinon.stub().returns(ret),
    acceptsEncodings: sinon.stub().returns(ret),
    acceptsLanguages: sinon.stub().returns(ret),
    body: {},
    flash: sinon.stub().returns(ret),
    get: sinon.stub().returns(ret),
    is: sinon.stub().returns(ret),
    params: {},
    query: {},
    session: {},
  }, options);
};

export default mockRequest;
