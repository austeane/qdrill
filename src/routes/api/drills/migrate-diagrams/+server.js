import { json } from '@sveltejs/kit';
import { fabricToExcalidraw } from '$lib/utils/diagramMigration';
import { createClient } from '@vercel/postgres';

export async function POST() {
  const client = createClient();
  await client.connect();

  try {
    // Get all drills with diagrams
    const drills = await client.query(`
      SELECT id, diagrams 
      FROM drills 
      WHERE diagrams IS NOT NULL AND diagrams != '[]'
    `);

    const updates = [];
    
    for (const drill of drills) {
      const migratedDiagrams = drill.diagrams.map(diagram => {
        if (!diagram) return null;
        
        // Check if it's already an Excalidraw diagram
        if (diagram.type === 'excalidraw') return diagram;
        
        // Convert Fabric diagram to Excalidraw
        return fabricToExcalidraw(diagram);
      }).filter(Boolean);

      // Update the drill with migrated diagrams
      updates.push(
        client.query(
          'UPDATE drills SET diagrams = $1 WHERE id = $2',
          [JSON.stringify(migratedDiagrams), drill.id]
        )
      );
    }

    await Promise.all(updates);

    return json({ 
      success: true, 
      message: `Successfully migrated ${updates.length} drills` 
    });
  } catch (error) {
    console.error('Error migrating diagrams:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await client.end();
  }
} 