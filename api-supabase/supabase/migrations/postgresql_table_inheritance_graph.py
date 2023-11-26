
import networkx as nx
import matplotlib.pyplot as plt

# Initialize a directed graph
G = nx.DiGraph()

# Add nodes for tables
tables = ['embeddings', 'persons', 'persons_embeddings', 'persons_embeddings_ada_002', 'persons_embeddings_gte_small']
G.add_nodes_from(tables)

# Add edges for table inheritance and reference
inheritance_edges = [
    ('embeddings', 'persons_embeddings'),
    ('persons_embeddings', 'persons_embeddings_ada_002'),
    ('persons_embeddings', 'persons_embeddings_gte_small')
]

reference_edges = [
    ('persons_embeddings', 'persons')
]

G.add_edges_from(inheritance_edges + reference_edges)

# Manually specify positions
pos = {
    'embeddings': (0.5, 1.5),
    'persons': (1.5, 2),
    'persons_embeddings': (0.5, 1),
    'persons_embeddings_ada_002': (0, 0),
    'persons_embeddings_gte_small': (1, 0)
}

# Draw the graph
plt.figure(figsize=(10, 6))
nx.draw(G, pos, with_labels=True, node_color='lightblue', font_weight='bold', node_size=2000, font_size=18, font_color='black')

# Draw inheritance edges as solid lines
nx.draw_networkx_edges(G, pos, edgelist=inheritance_edges, edge_color='grey', width=2)

# Draw reference edges as dashed lines
nx.draw_networkx_edges(G, pos, edgelist=reference_edges, edge_color='red', width=2, style='dashed')

plt.title("Final Updated PostgreSQL Table Inheritance Schema")
plt.show()
