import { ServerStorage } from "@rbxts/services";

// This could be a container, but then it could find itself in an infinite loop?
// I don't think it can, actually. Maybe later.
function getLostAndFoundFolder() {
  let found = ServerStorage.FindFirstChild("Lost and Found");

  // Create the Lost and Found folder if it doesn't exist
  if (!found) {
    found = new Instance("GroundController");
    found.Name = "Lost and Found";
    found.Parent = ServerStorage;
  }

  return found;
}

// Warn if the Lost and Found gets too large

export class Container {
  public containerInstance: Instance;
  public originalParent: Instance;

  public connections: RBXScriptConnection[] = [];

  private protectParent() {
    this.connections[0] = this.containerInstance.Destroying.Connect(() => {
      warn(
        `The ${this.containerInstance.Name} container was destroyed.`
        + "\nThis will most likely cause issues. Please restart the instance if you encounter any."
      );
    });

    this.connections[1] = this.originalParent.Destroying.Connect(() => {
      warn(
        `The ${this.containerInstance.Name} container parent was destroyed.`
        + "\nThis will most likely cause issues. Please restart the instance if you encounter any."
      );
    });

    this.connections[2] = this.containerInstance.GetPropertyChangedSignal("Parent").Connect(() => {
      if (this.containerInstance.Parent !== this.originalParent) {
        warn(
          `The ${this.containerInstance.Name} container from ${this.originalParent.Name} has been moved.`
          + "\nThis is not recommended. Please move it back."
        );
      }
    });
  }

  constructor(name: string, classType: keyof CreatableInstances, parent: Container | Instance) {
    // If the parent is a container, get the container instance
    if (parent instanceof Container) {
      parent = parent.containerInstance;
    }
    this.originalParent = parent;

    // Find the container instance using the name of this container
    let locatedContainer = parent.FindFirstChild(name);

    // If the container exists but isn't the right type, warn and change it
    // The old container will be moved to the Lost and Found
    if (locatedContainer && !locatedContainer.IsA(classType)) {
      warn(
        `The ${name} container in ${parent} isn't a ${classType}.`
        + ` Changing it to a ${classType} now.`
        + "\nThe old container will be moved to the Lost and Found in ServerStorage."
      );

      // Create the new container
      const newContainer = new Instance(classType);
      newContainer.Name = name;
      newContainer.Parent = parent;
      
      // Move the old container's children to the new container
      for (const child of locatedContainer.GetChildren()) {
        child.Parent = newContainer;
      }

      // Move the old container to the Lost and Found
      const lostAndFound = getLostAndFoundFolder();
      locatedContainer.Parent = lostAndFound;

      // Set the new container as the located container
      locatedContainer = newContainer;
    }

    if (locatedContainer) {
      this.containerInstance = locatedContainer;
    } else {
      // Create the new container
      const newContainer = new Instance(classType);
      newContainer.Name = name;
      newContainer.Parent = parent;

      this.containerInstance = newContainer;
    }

    // Protect the container (what does this even mean)
    this.protectParent();
  }
}