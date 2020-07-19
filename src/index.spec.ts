import "mocha";
import chai from "chai";
import "chai-http";
import { Server } from "ws";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
chai.should();

describe("loading express", () => {
    let server: Server;
    beforeEach(() => {
        delete require.cache[require.resolve('./index')];
        server = require('./index');
    });
    // afterEach((done) => {
    //     server.close(done);
    // });
    it("responds 200 to /", (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
             });
    });
    it("responds 404 to /pie", (done) => {
        chai.request(server)
            .get('/pie')
            .end((err, res) => {
                res.should.have.status(404);
                done();
             });
    });
});