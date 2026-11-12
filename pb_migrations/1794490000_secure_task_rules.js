/// <reference path="../pb_data/types.d.ts" />
// Security fix: per-user task isolation.
// Before this migration any logged-in user could list, view, edit or delete
// every other user's tasks (rules only checked "is logged in").
migrate((app) => {
  const tasks = app.findCollectionByNameOrId("tasks");
  tasks.listRule = "user = @request.auth.id";
  tasks.viewRule = "user = @request.auth.id";
  tasks.createRule = "@request.auth.id != \"\" && @request.body.user = @request.auth.id";
  tasks.updateRule = "user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";
  tasks.deleteRule = "user = @request.auth.id";
  return app.save(tasks);
}, (app) => {
  const tasks = app.findCollectionByNameOrId("tasks");
  const loggedIn = "@request.auth.id != \"\"";
  tasks.listRule = loggedIn;
  tasks.viewRule = loggedIn;
  tasks.createRule = loggedIn;
  tasks.updateRule = loggedIn;
  tasks.deleteRule = loggedIn;
  return app.save(tasks);
});
