import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
    Controls,
    Background,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import type {
    Node,
    Edge,
    NodeMouseHandler,
    ReactFlowInstance,
} from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';
import { nodeTypes } from '@/components/graph/CustomNodes';
import { useAppStore } from '@/store/useAppStore';
import { repoApi } from '@/services/api';

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 20 });

    nodes.forEach((node) => {
        
        dagreGraph.setNode(node.id, { width: 180, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                
                x: nodeWithPosition.x - 90,
                y: nodeWithPosition.y - 25,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const GraphView = () => {
    const { repoId } = useParams();
    const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
    const setReactFlowInstance = useAppStore((state) => state.setReactFlowInstance);
    const selectedNodeId = useAppStore((state) => state.selectedNodeId);
    const highlightedNodes = useAppStore((state) => state.highlightedNodes);

    // Use React Flow hooks for better performance
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Memoize types to prevent warnings
    const nodeTypesMemo = useMemo(() => nodeTypes, []);

    useEffect(() => {
        const fetchGraph = async () => {
            if (!repoId) return;
            try {
                const data = await repoApi.getRepoGraph(repoId);

                
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    data.nodes,
                    data.edges
                );

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (error) {
                console.error("Failed to load graph:", error);
            }
        };
        fetchGraph();
    }, [repoId, setNodes, setEdges]);

    // Handle selected node
    useEffect(() => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === selectedNodeId })));
    }, [selectedNodeId, setNodes]);

    // Handle highlighted nodes (from AI responses)
    useEffect(() => {
        setNodes((nds) => nds.map((n) => ({
            ...n,
            data: {
                ...n.data,
                highlighted: highlightedNodes.includes(n.id)
            }
        })));
    }, [highlightedNodes, setNodes]);

    const handleNodeClick: NodeMouseHandler = (_, node) => {
        setSelectedNodeId(node.id);
    };

    const handleLoad = (instance: ReactFlowInstance) => {
        setReactFlowInstance(instance);
        setTimeout(() => instance.fitView(), 100); 
    };

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypesMemo}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onInit={handleLoad}
            className="bg-transparent"
            fitView
        >
            <Controls className="[&_button]:bg-gray-700 [&_button]:border-gray-600 [&_button_path]:fill-white" />
            <Background color="#334155" gap={20} size={1} />
        </ReactFlow>
    );
};

export const RepoGraph = () => (
    <ReactFlowProvider>
        <GraphView />
    </ReactFlowProvider>
);