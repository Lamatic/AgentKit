const orders = {{triggerNode_1.output.orders}};

function computeStats(orders) {
  const today = new Date();
  return orders.map(o => {
    const stageEntered = new Date(o.stageEnteredDate);
    const dueDate = new Date(o.dueDate);
    const quantity = Number(o.quantity);
    const completedQuantity = Number(o.completedQuantity);
    const stages = Array.isArray(o.stages) ? o.stages : [];
    const stageIndex = stages.indexOf(o.currentStage);

    const isValid =
      !isNaN(stageEntered.getTime()) &&
      !isNaN(dueDate.getTime()) &&
      Number.isFinite(quantity) && quantity >= 0 &&
      Number.isFinite(completedQuantity) && completedQuantity >= 0 &&
      stages.length > 0 &&
      stageIndex !== -1;

    if (!isValid) {
      return {
        id: o.id,
        currentStage: o.currentStage,
        error: "Invalid or incomplete order data",
        atRisk: true
      };
    }

    const daysInStage = Math.floor((today.getTime() - stageEntered.getTime()) / 86400000);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
    const pctComplete = quantity > 0 ? Math.round((completedQuantity / quantity) * 100) : 0;
    const stagesRemaining = stages.length - stageIndex - 1;
    const atRisk = daysUntilDue < (stagesRemaining * 3) || (daysUntilDue < 0);

    return {
      id: o.id,
      currentStage: o.currentStage,
      daysInStage,
      daysUntilDue,
      pctComplete,
      stagesRemaining,
      atRisk
    };
  });
}

output = computeStats(orders);