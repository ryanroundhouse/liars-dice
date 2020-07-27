//process.env.NODE_ENV = 'test'

import "mocha";
import chai from "chai";
import "chai-http";
import { Server } from "ws";
import chaiHttp from "chai-http";
import session from "express-session";
import { response } from "express";

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

    describe("login tests", () => {
        it("login creates a session successfully", (done) => {
            chai.request(server)
                .post('/login')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
        it("login fails if already logged in", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/login')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            secondResponse.should.have.status(400);
                            done();
                        });
                });

        });
    });

    describe("logout tests",() => {
        it("destroy returns 400 if not logged in", (done) => {
            chai.request(server)
                .delete('/logout')
                .end((err, res) => {
                    if (err){
                        return done(err);
                    }
                    res.should.have.status(400);
                    done();
                });
        });
        it("destroy returns 200 if logged in", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    chai.request(server)
                        .delete('/logout')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            secondResponse.should.have.status(200);
                            done();
                        });
                });
        });
        it("can login again after logging out", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    chai.request(server)
                        .delete('/logout')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            secondResponse.should.have.status(200);
                            chai.request(server)
                                .post('/login')
                                .end((thirdError, thirdResponse) => {
                                    if (thirdError){
                                        return done(thirdError);
                                    }
                                    thirdResponse.should.have.status(200);
                                    done();
                                });
                        });
                });
        });
    });
    
    describe("create game tests", () => {
        it("can't create game if not logged in", (done) => {
            chai.request(server)
                .post('/game/create')
                .end((err, res) => {
                    if (err){
                        return done(err);
                    }
                    res.should.have.status(400);
                    done();
                });
        });
        it("can create game if logged in", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/game/create')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            secondResponse.should.have.status(200);
                            done();
                        });
                });
        });
        it("can join own created game if logged in", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/game/create')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            const gameId: string = secondResponse.body.message.gameId;
                            secondResponse.should.have.status(200);
                            const joinGameBody = {name: 'ryan'};
                            const joinGameUrl: string = `/game/${gameId}/join`;
                            chai.request(server)
                                .post(joinGameUrl)
                                .send(joinGameBody)
                                .set('Cookie', cookie(firstResponse))
                                .end((thirdError, thirdResponse) => {
                                    if (thirdError){
                                        return done(thirdError);
                                    }
                                    thirdResponse.should.have.status(200);
                                    done();
                                });
                        });
                });
        });
        it("can\'t create a new game if in a game", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/game/create')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            const gameId: string = secondResponse.body.message.gameId;
                            secondResponse.should.have.status(200);
                            const joinGameBody = {name: 'ryan'};
                            const joinGameUrl: string = `/game/${gameId}/join`;
                            chai.request(server)
                                .post(joinGameUrl)
                                .send(joinGameBody)
                                .set('Cookie', cookie(firstResponse))
                                .end((thirdError, thirdResponse) => {
                                    if (thirdError){
                                        return done(thirdError);
                                    }
                                    thirdResponse.should.have.status(200);
                                    chai.request(server)
                                        .post('/game/create')
                                        .set('Cookie', cookie(firstResponse))
                                        .end((secondError, secondResponse) => {
                                            if (secondError){
                                                return done(secondError);
                                            }
                                            secondResponse.should.have.status(400);
                                            done();
                                        });
                                });
                        });
                });
        });
    });
    describe("join game tests",() => {
        it("join game fails if not logged in", (done) => {
            chai.request(server)
                .post('/game/1/join')
                .end((err, res) => {
                    if (err){
                        return done(err);
                    }
                    res.should.have.status(400);
                    done();
                });
        });
        it("join game fails if game doesn't exist", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/game/10000000/join')
                        .set('Cookie', cookie(firstResponse))
                        .end((secondError, secondResponse) => {
                            if (secondError){
                                return done(secondError);
                            }
                            secondResponse.should.have.status(400);
                            done();
                        });
                });
        });
        it("join game fails if no name supplied", (done) => {
            chai.request(server)
                .post('/login')
                .end((firstError, firstResponse) => {
                    if (firstError){
                        return done(firstError);
                    }
                    firstResponse.should.have.status(200);
                    chai.request(server)
                        .post('/game/1/join')
                        .end((err, res) => {
                            if (err){
                                return done(err);
                            }
                            res.should.have.status(400);
                            done();
                        });
                });
        });
    });
});

function cookie(res: any) {
    const setCookie = res.headers['set-cookie'];
    return (setCookie && setCookie[0]) || undefined;
  }