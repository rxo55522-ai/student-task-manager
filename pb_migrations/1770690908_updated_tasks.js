/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2602490748")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1843675174",
    "max": 0,
    "min": 0,
    "name": "description",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1655102503",
    "maxSelect": 1,
    "name": "priority",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "Low",
      "Medium",
      "High"
    ]
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "Assignment",
      "Exam",
      "Project"
    ]
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date3275789471",
    "max": "",
    "min": "",
    "name": "dueDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2602490748")

  // remove field
  collection.fields.removeById("text1843675174")

  // remove field
  collection.fields.removeById("select1655102503")

  // remove field
  collection.fields.removeById("select2363381545")

  // remove field
  collection.fields.removeById("date3275789471")

  return app.save(collection)
})
