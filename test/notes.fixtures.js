function makeNotesArray() {
    return testNotes = [
        {
            id: 1,
            note_name: 'test-note 1',
            modified: '2029-01-22T16:28:32.615Z',
            content: 'test content 1',
            folder_id: 1 
        },
        {
            id: 2,
            note_name: 'test-note 2',
            modified: '2100-05-22T16:28:32.615Z',
            content: 'test content 2',
            folder_id: 2
        },
        {
            id: 3,
            note_name: 'test-note 3',
            modified: '1919-12-22T14:28:32.615Z',
            content: 'test content 3',
            folder_id: 3
        },
        {
            id: 4,
            note_name: 'test-note 4',
            modified: '1991-12-22T16:28:32.615Z',
            content: 'test content 4',
            folder_id: 5
        },
        {
            id: 5,
            note_name: 'test-note 5',
            modified: '1919-12-22T16:28:32.615Z',
            content: 'test content 5',
            folder_id: 5
        }
    ]
}

function makeMaliciousNote () {
    const maliciousNote = {
        id: 91,
        note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        modified:'1921-12-22T16:28:32.615Z',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        folder_id: '1'
      }
      const expectedNote = {
        ...maliciousNote,
        note_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
      }
      return {
        maliciousNote,
        expectedNote,
      }
    }


module.exports = { makeNotesArray, makeMaliciousNote}