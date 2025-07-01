let selectedObject = null;
const listeners = [];

export function setSelectedObject(obj) {
  selectedObject = obj;
  listeners.forEach((cb) => cb(obj)); // Notifie tous ceux qui écoutent
}

export function onSelectionChange(callback) {
  listeners.push(callback);
}

export function getSelectedObject() {
  return selectedObject;
}