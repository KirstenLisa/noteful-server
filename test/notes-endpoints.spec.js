require('dotenv').config()
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const xss = require('xss');
const { makeFoldersArray } = require('./folders.fixtures')
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures')


describe('Notes Endpoints', function() {

    let db

    before('make knex instance', () => {
        db = knex({
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));


  describe(`Unauthorized requests`, () => {
    const testFolders = makeFoldersArray();
    const testNotes = makeNotesArray()
        
    beforeEach('insert notes', () => {
       return db
            .into('noteful_folders')
            .insert(testFolders)
            .then(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
        })
        
        it(`responds with 401 Unauthorized for GET api/notes`, () => {
            return supertest(app)
            .get('/api/notes')
            .expect(401, { error: 'Unauthorized request' })
            })
            
        it(`responds with 401 Unauthorized for POST /api/notes`, () => {
            return supertest(app)
            .post('/api/notes')
            .send({ note_name: 'test-name', modified: '2100-05-22T16:28:32.615Z', content: 'test content', folder_id: 1 })
                    .expect(401, { error: 'Unauthorized request' })
                  })
            
        it(`responds with 401 Unauthorized for GET /api/notes/:id`, () => {
            const secondNote = testNotes[1]
            return supertest(app)
            .get(`/api/notes/${secondNote.id}`)
            .expect(401, { error: 'Unauthorized request' })
            })
            
        it(`responds with 401 Unauthorized for DELETE /folders/:id`, () => {
            const deleteNote = testNotes[1]
            return supertest(app)
            .delete(`/api/notes/${deleteNote.id}`)
            .expect(401, { error: 'Unauthorized request' })
            })
                })
        
    describe('GET/api/notes', () => {

        context('Given there are NO notes in the database', () => {
                
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/notes')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
            })
                
        })
                
        context('Given there ARE notes and folders in the database', () => {
                
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
                      
            beforeEach('insert folders and notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })
            })
                        
            it('gets the notes from the store', () => {
                return supertest(app)
                    .get('/api/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testNotes)
            })
            })

            context(`Given an XSS attack note`, () => {
                const { maliciousNote, expectedNote } = makeMaliciousNote()
          
                beforeEach('insert malicious note', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                            .into('noteful_notes')
                            .insert([maliciousNote])
                        })   
                })
          
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/notes`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                      expect(res.body[0].note_name).to.eql(expectedNote.note_name)
                      expect(res.body[0].content).to.eql(expectedNote.content)
                    })
                })
              })
        })
    
    describe('GET/api/notes/:id', () => {

        context('Given there are NO notes in the database', () => {
                
            it(`responds 404 the note doesn't exist`, () => {
                return supertest(app)
                    .get(`/api/notes/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                    error: { message: `Note doesn't exist` }
                })
            })
        })
    
        context('Given there ARE notes and folders in the database', () => {
                
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
                      
            beforeEach('insert folders and notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                    .into('noteful_notes')
                    .insert(testNotes)
                })
            })
    
            it('responds with 200 and the specified note', () => {
                const noteId = 2
                const expectedNote = testNotes[noteId - 1]
                    return supertest(app)
                        .get(`/api/notes/${noteId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, expectedNote)
          })
        })
    
        context(`Given an XSS attack note`, () => {
            const { maliciousNote, expectedNote } = makeMaliciousNote()
            const testFolders = makeFoldersArray()
                          
                beforeEach('insert folders and notes', () => {
                    return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                        .into('noteful_notes')
                        .insert(maliciousNote)
                    })
                })
      
        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/notes`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                  expect(res.body[0].note_name).to.eql(expectedNote.note_name)
                  expect(res.body[0].content).to.eql(expectedNote.content)
                })
            })
          })
        })
                
    describe('DELETE /notes/:id', () => {
        
        context(`Given no notes`, () => {
              
            it(`responds 404 the note doesn't exist`, () => {
                return supertest(app)
                  .delete(`/api/notes/123`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(404, {
                    error: { message: `Note doesn't exist` }
                  })
              })
            })
      
            context('Given there ARE notes and folders in the database', () => {
                
                const testFolders = makeFoldersArray()
                const testNotes = makeNotesArray()
                          
                beforeEach('insert folders and notes', () => {
                    return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                        .into('noteful_notes')
                        .insert(testNotes)
                    })
                })
        
              it('removes the note by ID from the store', () => {
                const idToRemove = 2
                const expectedNote = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                  .delete(`/api/notes/${idToRemove}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(204)
                  .then(() =>
                    supertest(app)
                      .get(`/api/notes`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedNote)
                  )
              })
            })
          })            

    describe(`POST /notes`, () => {
        const testFolders = makeFoldersArray();
        beforeEach('insert folders', () => {
            return db
                .insert(testFolders)
                .into('noteful_folders');
        });
        
        it(`responds with 400 missing 'name' if not supplied`, () => {

            const newNoteMissingName = {
                // note_name: 'test-name',
                modified: new Date(),
                content: 'test content',
                folder_id: 1,
              }
              return supertest(app)
                .post(`/api/notes`)
                .send(newNoteMissingName)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                  error: { message: "Missing 'note_name' in request body" }
                })
            })
        
            it(`responds with 400 missing 'content' if not supplied`, () => {
              const newNoteMissingContent = {
                 note_name: 'test-name',
                 modified: new Date(),
                 //content: 'test content',
                 folder_id: 1,
              }
              return supertest(app)
                .post(`/api/notes`)
                .send(newNoteMissingContent)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                  error: { message: "Missing 'content' in request body" }
                })
            })
        
            it(`responds with 400 missing 'folder_id' if not supplied`, () => {
              const newNoteMissingFolder = {
                note_name: 'test-name',
                modified: new Date(),
                content: 'test content',
                //folder_id: 1,
             }
              return supertest(app)
                .post(`/api/notes`)
                .send(newNoteMissingFolder)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                  error: { message: "Missing 'folder_id' in request body" }
                })
            })
        

    
        it('creates a note, responding with 201 and the new note', () => {
            const newNote = {
                note_name: 'test-name',
                modified: new Date(),
                content: 'test content',
                folder_id: 1,
             }
            
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.note_name).to.eql(newNote.note_name)
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                    const expected = new Intl.DateTimeFormat('en-US').format(new Date())
                    const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.modified))
                    expect(actual).to.eql(expected)
                })
                    
                    .then(res => {
                        supertest(app)
                        .get(`/api/notes/${res.body.id}`)
                        .expect(res.body);
                        })
                })

            it('removes XSS attack content', () => {
                const { maliciousNote, expectedNote } = makeMaliciousNote();
                    return supertest(app)
                        .post('/api/notes')
                        .send(maliciousNote)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(201)
                        .expect(res => {
                            expect(res.body.name).to.eql(expectedNote.name);
                            expect(res.body.content).to.eql(expectedNote.content);
                        })
                })
          })

    describe(`PATCH /api/notes/:id`, () => {
            context(`Given NO notes`, () => {
      
              it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                .patch(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Note doesn't exist` } })
            })
          })
    
        context('Given there ARE notes and folders in the database', () => {
                
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
                      
            beforeEach('insert folders and notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                    .into('noteful_notes')
                    .insert(testNotes)
                })
            })
        
            it('responds with 204 and updates the folder', () => {
                const idToUpdate = 2
                const updatedNote = {
                  note_name: 'updated name',
                  content: 'updated content',
                  folder_id: 2
                }
                const expectedNote = {
                  ...testNotes[idToUpdate -1],
                  ...updatedNote
                }
        
                return supertest(app)
                  .patch(`/api/notes/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send(updatedNote)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/notes/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedNote)
                  )
              })
            
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                .patch(`/api/notes/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                  error: {
                    message: `Request body must contain either 'note_name', 'content' or 'folder_id'`
                   }
                 })
                })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateNote = {
                            note_name: 'updated note name',
                       }
                    const expectedNote = {
                       ...testNotes[idToUpdate - 1],
                       ...updateNote
                    }
                    
                    return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({
                         ...updateNote,
                          fieldToIgnore: 'should not be in GET response'
                    })
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                      supertest(app)
                    .get(`/api/notes/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(expectedNote)
                        )
                      })

        })
        })

})



