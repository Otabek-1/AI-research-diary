// Drives the private editor the way the user does: add a section, add research,
// rename it, then read the publish payload the page would send to /api/admin/publish.
export default async function run(page, ui) {
  const report = { steps: [], payload: null, errors: [] };

  const acceptDialogs = (text) => {
    page.on("dialog", async (dialog) => {
      await dialog.accept(text);
    });
  };

  // --- 1. Add a root section (prompt supplies the name) ---
  acceptDialogs("My test section");
  const before = await ui.snapshot();
  const newSectionRef = before.match(/@(e\d+) button "New section"/)?.[1];
  if (!newSectionRef) return { error: "New section button not found", snapshot: before };
  await ui.click(newSectionRef);
  await page.waitForTimeout(600);
  report.steps.push("clicked New section");

  // --- 2. Add research inside that new section (prompt supplies the title) ---
  acceptDialogs("Attention Is All You Need");
  let snap = await ui.snapshot();
  const addResearchRef = snap.match(/@(e\d+) button "Add research inside My test section"/)?.[1];
  if (!addResearchRef) {
    report.steps.push("add-research button missing after add section");
    report.snapshotAfterSection = snap;
    return report;
  }
  await ui.click(addResearchRef);
  await page.waitForTimeout(800);
  report.steps.push("clicked + research");

  // --- 3. Read what the editor now thinks the document is ---
  report.editorState = await page.evaluate(() => {
    const title = document.querySelector(".title-input");
    const save = document.querySelector(".save-state");
    const tree = window.localStorage.getItem("field-notes-tree-shared");
    const pending = window.localStorage.getItem("field-notes-pending-files");
    const labels = window.localStorage.getItem("field-notes-section-labels");
    const draftKeys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith("field-notes-draft-"),
    );
    const draft = draftKeys.length
      ? JSON.parse(window.localStorage.getItem(draftKeys[0]))
      : null;
    return {
      titleValue: title ? title.value : null,
      saveState: save ? save.innerText : null,
      tree: tree ? JSON.parse(tree) : null,
      pendingFiles: pending ? JSON.parse(pending).map((file) => file.path) : null,
      sectionLabels: labels ? JSON.parse(labels) : null,
      draft: draft ? { id: draft.id, slug: draft.slug, title: draft.title, section: draft.section, status: draft.status } : null,
    };
  });

  // --- 4. Rename the document from the tree and confirm the slug follows ---
  acceptDialogs("Mechanistic Interpretability");
  snap = await ui.snapshot();
  const renameRef = snap.match(/@(e\d+) button "Rename Attention Is All You Need"/)?.[1];
  if (renameRef) {
    await ui.click(renameRef);
    await page.waitForTimeout(600);
    report.steps.push("renamed document from the tree");
  } else {
    report.steps.push("rename button in tree not found");
    report.treeSnapshot = snap.split("\n").filter((line) => line.includes("Attention")).join("\n");
  }

  report.afterRename = await page.evaluate(() => {
    const pending = window.localStorage.getItem("field-notes-pending-files");
    return {
      title: document.querySelector(".title-input")?.value ?? null,
      slugField: [...document.querySelectorAll(".metadata-fields input")].map((i) => i.value),
      tree: JSON.parse(window.localStorage.getItem("field-notes-tree-shared")),
      pendingFiles: pending ? JSON.parse(pending).map((f) => f.path) : null,
    };
  });

  // --- 5. Intercept the publish request and read the exact payload ---
  await page.route("**/api/admin/publish", async (route) => {
    const body = route.request().postDataJSON();
    report.payload = {
      filePaths: body.files.map((file) => file.path),
      fileCount: body.files.length,
      treeContent: body.files.find((file) => file.path === "content/tree.json")?.content,
      sectionsContent: body.files.find((file) => file.path === "content/sections.json")?.content,
      documentContent: body.files
        .filter((file) => file.path.startsWith("content/locales/"))
        .map((file) => ({ path: file.path, content: file.content })),
      deletes: body.deletes,
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, files: body.files.map((f) => f.path), deletes: body.deletes, branch: "master" }),
    });
  });

  snap = await ui.snapshot();
  const publishRef = snap.match(/@(e\d+) button "Publish to GitHub/)?.[1];
  if (!publishRef) {
    report.steps.push("publish button not found");
    return report;
  }
  await ui.click(publishRef);
  await page.waitForTimeout(1500);
  report.steps.push("clicked Publish to GitHub");
  report.finalMessage = await page.evaluate(
    () => document.querySelector(".save-state")?.innerText ?? null,
  );
  return report;
}
