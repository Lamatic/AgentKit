const orders = {{triggerNode_1.output.orders}};

function computeStats(orders) {
  const today = new Date();
  return orders.map(o => {
    const stageEntered = new Date(o.stageEnteredDate);
    const dueDate = new Date(o.dueDate);
    const quantity = Number(o.quantity);
    const completedQuantity = Number(o.completedQuantity);

    const daysInStage = Math.floor((today - stageEntered) / 86400000);
    const daysUntilDue = Math.floor((dueDate - today) / 86400000);
    const pctComplete = completedQuantity / quantity;
    const stageIndex = o.stages.indexOf(o.currentStage);
    const stagesRemaining = o.stages.length - stageIndex - 1;

    const atRisk = daysUntilDue < (stagesRemaining * 3) || (daysUntilDue < 0);

    return {
      id: o.id,
      currentStage: o.currentStage,
      daysInStage,
      daysUntilDue,
      pctComplete: Math.round(pctComplete * 100),
      stagesRemaining,
      atRisk
    };
  });
}

output = computeStats(orders);