const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const xss = require('xss');
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')


describe('Folders Endpoints', function() {

    let db

    before('make knex instance', () => {
        db = knex({
        client: 'pg',
        connection: process.env.TTEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));


  describe(`Unauthorized requests`, () => {
    const testFolders = makeFoldersArray()
        
    beforeEach('insert folders', () => {
       return db
            .into('noteful_folders')
            .insert(testFolders)
        })
        
        it(`responds with 401 Unauthorized for GET api/folders`, () => {
            return supertest(app)
            .get('/api/folders')
            .expect(401, { error: 'Unauthorized request' })
            })
            
        it(`responds with 401 Unauthorized for POST /api/folders`, () => {
            return supertest(app)
            .post('/api/folders')
            .send({ folder_name: 'test-name' })
                    .expect(401, { error: 'Unauthorized request' })
                  })
            
        it(`responds with 401 Unauthorized for GET /api/folders/:id`, () => {
            const secondFolder = testFolders[1]
            return supertest(app)
            .get(`/api/folders/${secondFolder.id}`)
            .expect(401, { error: 'Unauthorized request' })
            })
            
        it(`responds with 401 Unauthorized for DELETE /folders/:id`, () => {
            const deleteFolder = testFolders[1]
            return supertest(app)
            .delete(`/api/folders/${deleteFolder.id}`)
            .expect(401, { error: 'Unauthorized request' })
            })
                })
        
    describe('GET/api/folders', () => {

        context('Given there are NO folders in the database', () => {
                
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/folders')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
            })
                
        })
                
        context('Given there ARE folders in the database', () => {
                
            const testFolders = makeFoldersArray()
                      
            beforeEach('insert folders', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })
                        
            it('gets the folders from the store', () => {
                return supertest(app)
                    .get('/api/folders')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testFolders)
            })
            })

            context(`Given an XSS attack folder`, () => {
                const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
          
                beforeEach('insert malicious folder', () => {
                  return db
                    .into('noteful_folders')
                    .insert([maliciousFolder])
                })
          
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folders`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                      expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name)
                    })
                })
              })
        })
    
    describe('GET/api/folders/:id', () => {

        context('Given there are NO folders in the database', () => {
                
            it(`responds 404 the bookmark doesn't exist`, () => {
                return supertest(app)
                    .get(`/api/folders/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                    error: { message: `Folder doesn't exist` }
                })
            })
        })
    
        context('Given there ARE folders in the database', () => {
                
            const testFolders = makeFoldersArray()
                      
            beforeEach('insert folders', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })
    
            it('responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                    return supertest(app)
                        .get(`/api/folders/${folderId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, expectedFolder)
          })
        })
    
        context(`Given an XSS attack folder`, () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
      
            beforeEach('insert malicious folder', () => {
              return db
                .into('noteful_folders')
                .insert([maliciousFolder])
            })
      
        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/folders`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                  expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name)
                })
            })
          })
        })
                
    describe('DELETE /folder/:id', () => {
        
        context(`Given no folders`, () => {
              
            it(`responds 404 the folder doesn't exist`, () => {
                return supertest(app)
                  .delete(`/api/folders/123`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(404, {
                    error: { message: `Folder doesn't exist` }
                  })
              })
            })
      
            context('Given there ARE folders in the database', () => {
                
                const testFolders = makeFoldersArray()
                          
                beforeEach('insert folders', () => {
                    return db
                    .into('noteful_folders')
                    .insert(testFolders)
                })
        
              it('removes the folder by ID from the store', () => {
                const idToRemove = 2
                const expectedFolder = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                  .delete(`/api/folders/${idToRemove}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(204)
                  .then(() =>
                    supertest(app)
                      .get(`/api/folders`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedFolder)
                  )
              })
            })
          })            

    describe(`POST /folders`, () => {
        
        it(`responds with 400 missing 'name' if not supplied`, () => {
      
            const newFolderMissingName = {}
                return supertest(app)
                  .post(`/api/folders`)
                  .send(newFolderMissingName)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(400, {
                    error: { message: `'name' is required` }
                  })
              })

    
        it('creates a folder, responding with 201 and the new folder', () => {
            const newFolder = {
                folder_name: 'does not work'
            }
            console.log(newFolder)
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.folder_name).to.eql(newFolder.folder_name);
                    expect(res.body).to.have.property('id');
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
                    })
                    .then(res => {
                        supertest(app)
                        .get(`/api/folders/${res.body.id}`)
                        .expect(res.body);
                        })
                })

        it('removes XSS attack content from response', () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
                return supertest(app)
                  .post(`/api/folders`)
                  .send(maliciousFolder)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(201)
                  .expect(res => {
                    expect(res.body.folder_name).to.eql(expectedFolder.folder_name)
                  })
              })
          })

    describe(`PATCH /api/folders/:id`, () => {
            context(`Given NO folders`, () => {
      
              it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                .patch(`/api/folders/${folderId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Folder doesn't exist` } })
            })
          })
    
        context('Given there ARE folders in the database', () => {
                
            const testFolders = makeFoldersArray()
                      
            beforeEach('insert folders', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })
        
            it('responds with 204 and updates the folder', () => {
                const idToUpdate = 2
                const updatedFolder = {
                  folder_name: 'updated name',
                }
                const expectedFolder = {
                  ...testFolders[idToUpdate -1],
                  ...updatedFolder
                }
        
                return supertest(app)
                  .patch(`/api/folders/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send(updatedFolder)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/folders/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedFolder)
                  )
              })

            it(`responds with 400 when the required field is not supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                  .patch(`/api/folders/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(400, {
                    error: {
                      message: `Request body must contain 'folder_name'`
                    }
                  })
                })
        })
        })
    
    
            
          


})



