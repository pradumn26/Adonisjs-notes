'use strict'

const Schema = use('Schema')

class NotesTableSchema extends Schema {

  up () {
    this.create('notes', (table) => {
      table.increments()
      table.string('title');
      table.string('content');
      table.integer('user_id', 10).unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.timestamps()
    })
  }

  down () {
    this.drop('notes')
  }

}

module.exports = NotesTableSchema
