"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BatchStageNode from './BatchStageNode';

const nodeTypes = {
  batchStage: BatchStageNode,
};

const SupplyChainFlowchart = ({ batchData }) => {
  // Parse batch data to create nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    let yPosition = 0;
    const xSpacing = 300;
    const ySpacing = 150;

    if (!batchData || !batchData.stages || batchData.stages.length === 0) {
      // Return empty if no data
      return { initialNodes: [], initialEdges: [] };
    }

    // Helper function to create node
    const createNode = (id, data, position, type = 'batchStage') => ({
      id,
      type,
      position,
      data,
    });

    // Helper function to create edge
    const createEdge = (source, target, label = '', animated = false, quantityChange = null) => ({
      id: `${source}-${target}`,
      source,
      target,
      label,
      animated,
      style: {
        stroke: quantityChange && quantityChange < 0 ? '#ef4444' : '#10b981',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: quantityChange && quantityChange < 0 ? '#ef4444' : '#10b981',
      },
    });

    // Process each stage
    batchData.stages.forEach((stage, index) => {
      const nodeId = `stage-${index}`;

      // Calculate position
      let xPosition = index * xSpacing;
      let yPos = yPosition;

      // Check if this stage has splits
      if (stage.splits && stage.splits.length > 0) {
        // Create main node for the stage before split
        nodes.push(createNode(
          nodeId,
          {
            ...stage,
            label: stage.stageName,
            quantity: stage.quantity,
            price: stage.price,
            date: stage.date,
            actor: stage.actor,
            location: stage.location,
            notes: stage.notes,
            isSplit: true,
          },
          { x: xPosition, y: yPos }
        ));

        // Create split nodes
        stage.splits.forEach((split, splitIndex) => {
          const splitNodeId = `split-${index}-${splitIndex}`;
          const splitYPos = yPos + ySpacing * (splitIndex + 1);

          nodes.push(createNode(
            splitNodeId,
            {
              ...split,
              label: `${stage.stageName} - Split ${splitIndex + 1}`,
              quantity: split.quantity,
              price: split.price,
              date: split.date,
              actor: split.actor,
              destination: split.destination,
              notes: split.notes,
              isSplitChild: true,
              parentStage: stage.stageName,
            },
            { x: xPosition + xSpacing / 2, y: splitYPos }
          ));

          // Create edge from main stage to split
          const quantityChange = split.quantity - stage.quantity;
          edges.push(createEdge(
            nodeId,
            splitNodeId,
            `${split.quantity} ${stage.unit || 'kg'}`,
            false,
            quantityChange
          ));

          // Connect to next stage if exists
          if (index < batchData.stages.length - 1) {
            const nextStageId = `stage-${index + 1}`;
            edges.push(createEdge(
              splitNodeId,
              nextStageId,
              '',
              true
            ));
          }
        });
      } else {
        // Regular node without splits
        nodes.push(createNode(
          nodeId,
          {
            ...stage,
            label: stage.stageName,
            quantity: stage.quantity,
            price: stage.price,
            date: stage.date,
            actor: stage.actor,
            location: stage.location,
            notes: stage.notes,
          },
          { x: xPosition, y: yPos }
        ));

        // Create edge to next stage
        if (index > 0) {
          const prevStage = batchData.stages[index - 1];
          const prevNodeId = `stage-${index - 1}`;

          // Calculate quantity change
          const quantityChange = stage.quantity - prevStage.quantity;
          const wastage = prevStage.quantity - stage.quantity;

          let label = '';
          if (wastage > 0) {
            label = `Wastage: ${wastage.toFixed(2)} ${stage.unit || 'kg'}`;
          } else if (quantityChange > 0) {
            label = `+${quantityChange.toFixed(2)} ${stage.unit || 'kg'}`;
          }

          edges.push(createEdge(
            prevNodeId,
            nodeId,
            label,
            false,
            quantityChange
          ));
        }
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [batchData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => [...eds, params]),
    [setEdges]
  );

  if (!batchData || !batchData.stages || batchData.stages.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500 text-sm">No supply chain data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Legend - Moved outside and above the flowchart */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="font-semibold text-gray-700">Legend:</span>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Regular Stage</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">Split Point</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600">Split Batch</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">Quantity Loss</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">Quantity Maintained</span>
          </div>
        </div>
      </div>

      {/* Flowchart */}
      <div className="w-full h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.isSplitChild) return '#f59e0b';
              if (node.data.isSplit) return '#8b5cf6';
              return '#10b981';
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SupplyChainFlowchart;
